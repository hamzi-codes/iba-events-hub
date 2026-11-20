const mongoose = require('mongoose');
const { User, Organisation, Venue, Event, Setting } = require('../models');
const { ROLES, AFFILIATION_TYPES } = require('../models/User');
const { CATEGORIES } = require('../models/Organisation');
const { STATUSES } = require('../models/Event');
const { ApiError } = require('../middleware/errorHandler');
const { EVENT_POPULATE, serializeEvent, serializeUser } = require('../utils/serializers');
const { loadHistory } = require('../utils/eventQueries');

const AFFILIATION_POPULATE = { path: 'affiliations.organisationId', select: 'name category' };
const NOT_FOUND = (what) => new ApiError(404, 'NOT_FOUND', `We could not find that ${what}.`);
const ci = { locale: 'en', strength: 2 }; // case-insensitive comparisons and sorting
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const validId = (v) => typeof v === 'string' && mongoose.isValidObjectId(v);

function fieldError(fields, message = 'Some details need fixing. Check the highlighted fields and try again.') {
  return new ApiError(400, 'VALIDATION_ERROR', message, fields);
}

// Accepts 120 or "120", rejects 1.5, -1, "abc", objects.
function wholeNumber(v) {
  if (typeof v === 'number' && Number.isInteger(v)) return v;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return Number(v.trim());
  return null;
}

// ---------- roles and links between users and organisations ----------

// Roles always follow the links: student for everyone, organiser/approver only
// while the user has a link of that type (AUT-08, AUT-09), admin only if kept.
function recomputeRoles(user, isAdmin) {
  const has = (type) => user.affiliations.some((a) => a.type === type);
  user.roles = ROLES.filter(
    (r) => r === 'student' || (r === 'admin' && isAdmin) || (r === 'organiser' && has('organiser')) || (r === 'approver' && has('approver'))
  );
}
const sameLink = (a, orgId, type) => String(a.organisationId._id || a.organisationId) === String(orgId) && a.type === type;

async function loadUsersOrFail(ids, field) {
  const users = await User.find({ _id: { $in: ids } });
  if (users.length !== new Set(ids.map(String)).size) {
    throw fieldError({ [field]: 'One or more of these accounts could not be found.' });
  }
  return users;
}

// Makes the set of users linked to an organisation with this type equal to wantedIds.
async function syncOrganisationUsers(orgId, type, wantedIds) {
  const wanted = new Set(wantedIds.map(String));
  const current = await User.find({ affiliations: { $elemMatch: { organisationId: orgId, type } } });
  const currentIds = new Set(current.map((u) => String(u._id)));

  for (const user of current) {
    if (wanted.has(String(user._id))) continue;
    user.affiliations = user.affiliations.filter((a) => !sameLink(a, orgId, type));
    recomputeRoles(user, user.roles.includes('admin'));
    await user.save();
  }
  const toAdd = await User.find({ _id: { $in: [...wanted].filter((id) => !currentIds.has(id)) } });
  for (const user of toAdd) {
    user.affiliations.push({ organisationId: orgId, type });
    recomputeRoles(user, user.roles.includes('admin'));
    await user.save();
  }
}

// ---------- users (ADM-01, ADM-02, AUT-08, AUT-09) ----------

async function fetchUser(id) {
  if (!validId(id)) throw NOT_FOUND('user');
  const user = await User.findById(id).populate(AFFILIATION_POPULATE);
  if (!user) throw NOT_FOUND('user');
  return user;
}

async function listUsers(req, res) {
  const { search, role, status } = req.query;
  const fields = {};
  if (search !== undefined && (typeof search !== 'string' || search.length > 100)) fields.search = 'Enter up to 100 characters.';
  if (role !== undefined && !ROLES.includes(role)) fields.role = `Use one of: ${ROLES.join(', ')}.`;
  if (status !== undefined && !['active', 'inactive'].includes(status)) fields.status = 'Use active or inactive.';
  if (Object.keys(fields).length) throw fieldError(fields);

  const filter = {};
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ fullName: rx }, { email: rx }];
  }
  if (role) filter.roles = role;
  if (status) filter.isActive = status === 'active';

  const users = await User.find(filter).collation(ci).sort({ fullName: 1 }).limit(500).populate(AFFILIATION_POPULATE);
  res.json(users.map(serializeUser));
}

async function getUser(req, res) {
  res.json(serializeUser(await fetchUser(req.params.id)));
}

// PUT /admin/users/:id/access  { roles: [...], affiliations: [{ organisationId, type }] }
async function updateAccess(req, res) {
  const user = await fetchUser(req.params.id);
  const { roles, affiliations } = req.body;

  // links: valid, unique, pointing at real organisations
  const links = [];
  const seen = new Set();
  for (const a of affiliations) {
    const key = `${a.organisationId}:${a.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      links.push({ organisationId: a.organisationId, type: a.type });
    }
  }
  const orgIds = [...new Set(links.map((l) => l.organisationId))];
  const found = await Organisation.countDocuments({ _id: { $in: orgIds } });
  if (found !== orgIds.length) throw fieldError({ affiliations: 'One of the organisations could not be found.' });

  // a role needs at least one link of its type (AUT-09)
  for (const type of AFFILIATION_TYPES) {
    if (roles.includes(type) && !links.some((l) => l.type === type)) {
      throw fieldError({ affiliations: `Link at least one organisation before giving the ${type} role.` });
    }
  }
  const makeAdmin = roles.includes('admin');
  if (String(user._id) === String(req.user._id) && user.roles.includes('admin') && !makeAdmin) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot remove your own admin role.');
  }

  user.affiliations = links;
  recomputeRoles(user, makeAdmin);
  await user.save();
  res.json(serializeUser(await fetchUser(req.params.id)));
}

async function setUserStatus(req, res) {
  const user = await fetchUser(req.params.id);
  if (String(user._id) === String(req.user._id) && req.body.isActive === false) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot deactivate your own account.');
  }
  user.isActive = req.body.isActive; // records (events, decisions, registrations) are never touched
  await user.save();
  res.json(serializeUser(await fetchUser(req.params.id)));
}

// ---------- organisations (ADM-03, ADM-04) ----------

async function describeOrganisations(orgs) {
  const ids = orgs.map((o) => o._id);
  const users = await User.find({ 'affiliations.organisationId': { $in: ids } })
    .select('fullName email affiliations')
    .collation(ci)
    .sort({ fullName: 1 })
    .lean();
  const people = new Map(ids.map((id) => [String(id), { organiser: [], approver: [] }]));
    const pendingRows = await Event.aggregate([
    { $match: { organisationId: { $in: ids }, status: 'PENDING' } },
    { $group: { _id: '$organisationId', n: { $sum: 1 } } },
  ]);
  const pendingBy = new Map(pendingRows.map((r) => [String(r._id), r.n]));
  users.forEach((u) =>
    u.affiliations.forEach((a) => {
      const bucket = people.get(String(a.organisationId));
      if (bucket) bucket[a.type].push({ id: String(u._id), fullName: u.fullName, email: u.email });
    })
  );
  return orgs.map((o) => {
    const p = people.get(String(o._id));
    return {
      id: String(o._id),
      name: o.name,
      category: o.category,
      description: o.description,
      isActive: o.isActive,
      organiserCount: p.organiser.length,
      approverCount: p.approver.length,
      pendingEventsCount: pendingBy.get(String(o._id)) || 0,
      approvers: p.approver,
      organisers: p.organiser,
      createdAt: o.createdAt.toISOString(),
    };
  });
}

async function nameTaken(category, name, exceptId) {
  const filter = { category, name };
  if (exceptId) filter._id = { $ne: exceptId };
  return Boolean(await Organisation.findOne(filter).collation(ci).select('_id').lean());
}
const DUPLICATE_ORG = { name: 'An organisation with this name already exists in this category.' };

async function listOrganisations(req, res) {
  const { category, includeInactive } = req.query;
  if (category !== undefined && !CATEGORIES.includes(category)) throw fieldError({ category: 'Use society, school or department.' });
  const filter = {};
  if (category) filter.category = category;
  if (includeInactive === 'false') filter.isActive = true; // default: active and inactive in one list
  const orgs = await Organisation.find(filter).collation(ci).sort({ name: 1 }).lean();
  res.json(await describeOrganisations(orgs));
}

async function createOrganisation(req, res) {
  const { category, name, description = '', approverUserIds, organiserUserIds = [] } = req.body;
  if (await nameTaken(category, name)) throw fieldError(DUPLICATE_ORG);

  const approvers = await loadUsersOrFail(approverUserIds, 'approverUserIds');
  if (approvers.some((u) => !u.isActive)) throw fieldError({ approverUserIds: 'Deactivated accounts cannot be approving authorities.' });
  const organisers = await loadUsersOrFail(organiserUserIds, 'organiserUserIds');
  if (organisers.some((u) => !u.isActive)) throw fieldError({ organiserUserIds: 'Deactivated accounts cannot be organisers.' });

  let org;
  try {
    org = await Organisation.create({ category, name, description });
  } catch (err) {
    if (err.code === 11000) throw fieldError(DUPLICATE_ORG);
    throw err;
  }
  await syncOrganisationUsers(org._id, 'approver', approverUserIds);
  await syncOrganisationUsers(org._id, 'organiser', organiserUserIds);
  res.status(201).json((await describeOrganisations([org.toObject()]))[0]);
}

async function updateOrganisation(req, res) {
  if (!validId(req.params.id)) throw NOT_FOUND('organisation');
  const org = await Organisation.findById(req.params.id);
  if (!org) throw NOT_FOUND('organisation');
  const { name, description, approverUserIds, organiserUserIds } = req.body;

  if (name !== undefined && (await nameTaken(org.category, name, org._id))) throw fieldError(DUPLICATE_ORG);
  if (approverUserIds) {
    const users = await loadUsersOrFail(approverUserIds, 'approverUserIds');
    const already = await User.find({ affiliations: { $elemMatch: { organisationId: org._id, type: 'approver' } } }).select('_id').lean();
    const alreadyIds = new Set(already.map((u) => String(u._id)));
    if (users.some((u) => !u.isActive && !alreadyIds.has(String(u._id)))) {
      throw fieldError({ approverUserIds: 'Deactivated accounts cannot be approving authorities.' });
    }
  }
  if (organiserUserIds) await loadUsersOrFail(organiserUserIds, 'organiserUserIds');

  if (name !== undefined) org.name = name;
  if (description !== undefined) org.description = description;
  try {
    await org.save();
  } catch (err) {
    if (err.code === 11000) throw fieldError(DUPLICATE_ORG);
    throw err;
  }
  if (approverUserIds) await syncOrganisationUsers(org._id, 'approver', approverUserIds);
  if (organiserUserIds) await syncOrganisationUsers(org._id, 'organiser', organiserUserIds);
  res.json((await describeOrganisations([org.toObject()]))[0]);
}

async function setOrganisationStatus(req, res) {
  if (!validId(req.params.id)) throw NOT_FOUND('organisation');
  const org = await Organisation.findById(req.params.id);
  if (!org) throw NOT_FOUND('organisation');
  if (req.body.isActive === false) {
    const pending = await Event.countDocuments({ organisationId: org._id, status: 'PENDING' });
    if (pending > 0) {
      throw new ApiError(
        409,
        'HAS_PENDING_EVENTS',
        `This organisation has ${pending} pending event${pending === 1 ? '' : 's'}. Decide on them first, then deactivate.`
      );
    }
  }
  org.isActive = req.body.isActive;
  await org.save();
  res.json((await describeOrganisations([org.toObject()]))[0]);
}

// ---------- venues (ADM-05) ----------

const venueJson = (v) => ({ id: String(v._id), name: v.name, location: v.location, capacity: v.capacity, isActive: v.isActive });
const DUPLICATE_VENUE = { name: 'A venue with this name already exists.' };

async function listVenues(req, res) {
  const venues = await Venue.find().collation(ci).sort({ name: 1 }).lean();
  res.json(venues.map(venueJson)); // includes inactive ones
}

async function createVenue(req, res) {
  const { name, location = '' } = req.body;
  if (await Venue.findOne({ name }).collation(ci).select('_id').lean()) throw fieldError(DUPLICATE_VENUE);
  try {
    const venue = await Venue.create({ name, location, capacity: wholeNumber(req.body.capacity) });
    res.status(201).json(venueJson(venue));
  } catch (err) {
    if (err.code === 11000) throw fieldError(DUPLICATE_VENUE);
    throw err;
  }
}

async function updateVenue(req, res) {
  if (!validId(req.params.id)) throw NOT_FOUND('venue');
  const venue = await Venue.findById(req.params.id);
  if (!venue) throw NOT_FOUND('venue');
  const { name, location = '' } = req.body;
  if (await Venue.findOne({ name, _id: { $ne: venue._id } }).collation(ci).select('_id').lean()) throw fieldError(DUPLICATE_VENUE);
  venue.name = name;
  venue.location = location;
  venue.capacity = wholeNumber(req.body.capacity);
  try {
    await venue.save();
  } catch (err) {
    if (err.code === 11000) throw fieldError(DUPLICATE_VENUE);
    throw err;
  }
  res.json(venueJson(venue));
}

async function setVenueStatus(req, res) {
  if (!validId(req.params.id)) throw NOT_FOUND('venue');
  const venue = await Venue.findById(req.params.id);
  if (!venue) throw NOT_FOUND('venue');
  venue.isActive = req.body.isActive; // existing events keep their venue
  await venue.save();
  res.json(venueJson(venue));
}

// ---------- all events, read only (ADM-07) ----------

async function listEvents(req, res) {
  const { status, search } = req.query;
  const fields = {};
  if (status !== undefined && !STATUSES.includes(status)) fields.status = `Use one of: ${STATUSES.join(', ')}.`;
  if (search !== undefined && (typeof search !== 'string' || search.length > 100)) fields.search = 'Enter up to 100 characters.';
  if (Object.keys(fields).length) throw fieldError(fields);

  const filter = {};
  if (status) filter.status = status;
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    const orgIds = await Organisation.find({ name: rx }).distinct('_id');
    filter.$or = [{ title: rx }, { organisationId: { $in: orgIds } }];
  }
  const events = await Event.find(filter).sort({ createdAt: -1, _id: -1 }).limit(500).populate(EVENT_POPULATE);
  const history = await loadHistory(events.map((e) => e._id));
  res.json(events.map((e) => serializeEvent(e, history.get(String(e._id)) || [])));
}

// ---------- settings (ADM-06, Could) ----------

const DOMAIN_RX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

function settingsJson(s) {
  const types = (s && s.eventTypes) || {};
  return {
    allowedEmailDomains: (s && s.allowedEmailDomains) || [],
    eventTypes: { society: types.society || [], school: types.school || [], department: types.department || [] },
  };
}
const getSettings = async (req, res) => res.json(settingsJson(await Setting.findOne().lean()));

function cleanList(list, field, { lower, test, max = 60 }) {
  if (!Array.isArray(list)) throw fieldError({ [field]: 'Send a list.' });
  const out = [];
  const seen = new Set();
  for (const item of list) {
    if (typeof item !== 'string') throw fieldError({ [field]: 'Every item must be text.' });
    const value = lower ? item.trim().toLowerCase() : item.trim();
    if (!value) continue;
    if (value.length > max) throw fieldError({ [field]: `Each item can have at most ${max} characters.` });
    if (test && !test(value)) throw fieldError({ [field]: `"${value}" is not valid.` });
    if (!seen.has(value.toLowerCase())) {
      seen.add(value.toLowerCase());
      out.push(value);
    }
  }
  if (out.length === 0) throw fieldError({ [field]: 'Keep at least one item in this list.' });
  return out;
}

async function updateSettings(req, res) {
  const { allowedEmailDomains, eventTypes } = req.body || {};
  if (allowedEmailDomains === undefined && eventTypes === undefined) {
    throw fieldError({ allowedEmailDomains: 'Send allowedEmailDomains and/or eventTypes.' });
  }
  if (eventTypes !== undefined && (typeof eventTypes !== 'object' || eventTypes === null || Array.isArray(eventTypes))) {
    throw fieldError({ eventTypes: 'Send an object with society, school and department lists.' });
  }
  const domains = allowedEmailDomains === undefined ? undefined : cleanList(allowedEmailDomains, 'allowedEmailDomains', { lower: true, test: (v) => DOMAIN_RX.test(v), max: 100 });
  const types = {};
  for (const category of CATEGORIES) {
    if (eventTypes && eventTypes[category] !== undefined) {
      types[category] = cleanList(eventTypes[category], `eventTypes.${category}`, {});
    }
  }
  let settings = await Setting.findOne();
  if (!settings) settings = new Setting({});
  if (domains) settings.allowedEmailDomains = domains;
  Object.entries(types).forEach(([category, list]) => settings.set(`eventTypes.${category}`, list));
  await settings.save();
  res.json(settingsJson(settings.toObject()));
}

module.exports = {
  listUsers, getUser, updateAccess, setUserStatus,
  listOrganisations, createOrganisation, updateOrganisation, setOrganisationStatus,
  listVenues, createVenue, updateVenue, setVenueStatus,
  listEvents, getSettings, updateSettings,
};
