import { ApiError } from '../ApiError';
import { getAllUsers, getCurrentUser } from './mockAuth';
import { CATEGORIES, ORG_LIST, VENUES, events, findOrg, toEventObject } from './mockData';
import { delay } from './mockUtils';

// Mock versions of the admin endpoints (Master Document 6.6). They copy the rules in
// Sections 5.7 and 6.6, so the admin screens can be built and tested before the API exists.

const forbidden = (message) => new ApiError({ status: 403, code: 'FORBIDDEN', message });
const notFound = (what) => new ApiError({ status: 404, code: 'NOT_FOUND', message: `We could not find that ${what}. Go back and try again.` });
const invalid = (fields, message = 'Some details need fixing. Check the highlighted fields and try again.') =>
  new ApiError({ status: 400, code: 'VALIDATION_ERROR', message, fields });

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user.roles.includes('admin')) throw forbidden('You do not have permission to do that.');
  return user;
}

// ---------- users ----------
const userView = (u) => ({
  id: u.id,
  fullName: u.fullName,
  email: u.email,
  roles: u.roles,
  affiliations: u.affiliations,
  isActive: u.isActive,
  isVerified: u.isVerified,
});

const findUser = (id) => getAllUsers().find((u) => u.id === id);

// GET /admin/users?search=&role=&status=active|inactive
export async function getUsers({ search, role, status } = {}) {
  await delay();
  await requireAdmin();
  const text = String(search || '').trim().toLowerCase();
  return getAllUsers()
    .filter((u) => !text || u.fullName.toLowerCase().includes(text) || u.email.toLowerCase().includes(text))
    .filter((u) => !role || u.roles.includes(role))
    .filter((u) => !status || (status === 'active' ? u.isActive : !u.isActive))
    .sort((a, b) => a.fullName.localeCompare(b.fullName))
    .map(userView);
}

// GET /admin/users/:id
export async function getUser(id) {
  await delay(250);
  await requireAdmin();
  const user = findUser(id);
  if (!user) throw notFound('user');
  return userView(user);
}

// PUT /admin/users/:id/access   { roles, affiliations: [{ organisationId, type }] }
// The organiser and approver roles follow the links: a link of a type gives the role, and
// removing the last link of a type removes the role (Section 6.6).
export async function updateAccess(id, { roles, affiliations } = {}) {
  await delay(450);
  const admin = await requireAdmin();
  const user = findUser(id);
  if (!user) throw notFound('user');

  const links = [];
  const seen = new Set();
  for (const link of affiliations || []) {
    const organisation = findOrg(link.organisationId);
    if (!organisation) throw invalid({ affiliations: 'One of the organisations no longer exists. Remove it and try again.' });
    if (!['organiser', 'approver'].includes(link.type)) throw invalid({ affiliations: 'Choose organiser or approver for each organisation.' });
    const key = `${link.organisationId}:${link.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ organisationId: organisation.id, organisationName: organisation.name, category: organisation.category, type: link.type });
  }
  const wanted = new Set(roles || []);
  if (!wanted.has('student')) throw invalid({ roles: 'Every account keeps the student role.' });
  if (user.id === admin.id && !wanted.has('admin')) throw forbidden('You cannot remove your own administrator access.');
  if (wanted.has('organiser') && !links.some((l) => l.type === 'organiser')) {
    throw invalid({ affiliations: 'Add an organisation for the organiser role, or remove the role.' });
  }
  if (wanted.has('approver') && !links.some((l) => l.type === 'approver')) {
    throw invalid({ affiliations: 'Add an organisation for the approver role, or remove the role.' });
  }

  user.roles = ['student', ...(wanted.has('admin') ? ['admin'] : [])];
  if (links.some((l) => l.type === 'organiser')) user.roles.push('organiser');
  if (links.some((l) => l.type === 'approver')) user.roles.push('approver');
  user.affiliations = links;
  return userView(user);
}

// PATCH /admin/users/:id/status   { isActive }
export async function setUserStatus(id, { isActive }) {
  await delay(350);
  const admin = await requireAdmin();
  const user = findUser(id);
  if (!user) throw notFound('user');
  if (user.id === admin.id && !isActive) throw forbidden('You cannot deactivate your own account.');
  user.isActive = !!isActive;
  return userView(user);
}

// ---------- organisations ----------
const linkedUsers = (organisationId, type) =>
  getAllUsers().filter((u) => u.affiliations.some((a) => a.organisationId === organisationId && a.type === type));
const person = (u) => ({ id: u.id, fullName: u.fullName, email: u.email });

const organisationView = (o) => {
  const approvers = linkedUsers(o.id, 'approver').map(person);
  const organisers = linkedUsers(o.id, 'organiser').map(person);
  return {
    id: o.id,
    name: o.name,
    category: o.category,
    description: o.description,
    isActive: o.isActive,
    approvers,
    organisers,
    approverCount: approvers.length,
    organiserCount: organisers.length,
    pendingEventsCount: events.filter((ev) => ev.organisationId === o.id && ev.status === 'PENDING').length,
  };
};

// Give or take links so exactly these users are linked to the organisation with that type.
function syncLinks(organisation, type, userIds) {
  const wanted = new Set(userIds);
  getAllUsers().forEach((u) => {
    const has = u.affiliations.some((a) => a.organisationId === organisation.id && a.type === type);
    if (wanted.has(u.id) && !has) {
      u.affiliations = [
        ...u.affiliations,
        { organisationId: organisation.id, organisationName: organisation.name, category: organisation.category, type },
      ];
    } else if (!wanted.has(u.id) && has) {
      u.affiliations = u.affiliations.filter((a) => !(a.organisationId === organisation.id && a.type === type));
    }
    // The role follows the links (Section 6.6).
    const base = u.roles.filter((r) => r !== 'organiser' && r !== 'approver');
    if (u.affiliations.some((a) => a.type === 'organiser')) base.push('organiser');
    if (u.affiliations.some((a) => a.type === 'approver')) base.push('approver');
    u.roles = base;
  });
}

function validateOrganisation({ name, description, approverUserIds, organiserUserIds }, { category, selfId }) {
  const fields = {};
  const text = String(name || '').trim();
  if (text.length < 2 || text.length > 80) fields.name = 'Enter a name of 2 to 80 characters.';
  else if (ORG_LIST.some((o) => o.id !== selfId && o.category === category && o.name.toLowerCase() === text.toLowerCase())) {
    fields.name = 'An organisation with this name already exists in this category.';
  }
  if (String(description || '').length > 300) fields.description = 'The description can have at most 300 characters.';
  const approvers = approverUserIds || [];
  if (approvers.length < 1) fields.approverUserIds = 'Add at least one approving authority.';
  [...approvers, ...(organiserUserIds || [])].forEach((id) => {
    if (!findUser(id)) fields.approverUserIds = fields.approverUserIds || 'One of the accounts could not be found. Remove it and add it again.';
  });
  return fields;
}

// GET /admin/organisations?category=&includeInactive=true
export async function getOrganisations({ category, includeInactive } = {}) {
  await delay();
  await requireAdmin();
  return ORG_LIST.filter((o) => (!category || o.category === category) && (includeInactive || o.isActive))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(organisationView);
}

// POST /admin/organisations
export async function createOrganisation(payload) {
  await delay(500);
  await requireAdmin();
  if (!CATEGORIES.some((c) => c.key === payload.category)) throw invalid({ category: 'Choose Society, School or Department.' });
  const fields = validateOrganisation(payload, { category: payload.category });
  if (Object.keys(fields).length) throw invalid(fields);
  const organisation = {
    id: `org-new-${ORG_LIST.length + 1}`,
    name: payload.name.trim(),
    category: payload.category,
    description: String(payload.description || '').trim(),
    isActive: true,
  };
  ORG_LIST.push(organisation);
  syncLinks(organisation, 'approver', payload.approverUserIds);
  syncLinks(organisation, 'organiser', payload.organiserUserIds || []);
  return organisationView(organisation);
}

// PUT /admin/organisations/:id
export async function updateOrganisation(id, payload) {
  await delay(500);
  await requireAdmin();
  const organisation = findOrg(id);
  if (!organisation) throw notFound('organisation');
  const fields = validateOrganisation(payload, { category: organisation.category, selfId: id });
  if (Object.keys(fields).length) throw invalid(fields);
  organisation.name = payload.name.trim();
  organisation.description = String(payload.description || '').trim();
  syncLinks(organisation, 'approver', payload.approverUserIds);
  syncLinks(organisation, 'organiser', payload.organiserUserIds || []);
  // keep the names inside the users' links up to date
  getAllUsers().forEach((u) => {
    u.affiliations = u.affiliations.map((a) => (a.organisationId === id ? { ...a, organisationName: organisation.name } : a));
  });
  return organisationView(organisation);
}

// PATCH /admin/organisations/:id/status   409 HAS_PENDING_EVENTS when deactivating
export async function setOrganisationStatus(id, { isActive }) {
  await delay(350);
  await requireAdmin();
  const organisation = findOrg(id);
  if (!organisation) throw notFound('organisation');
  if (!isActive) {
    const pending = events.filter((ev) => ev.organisationId === id && ev.status === 'PENDING').length;
    if (pending > 0) {
      throw new ApiError({
        status: 409,
        code: 'HAS_PENDING_EVENTS',
        message: `This organisation has ${pending} pending ${pending === 1 ? 'event' : 'events'}. Ask the approver to decide on ${pending === 1 ? 'it' : 'them'} first, then deactivate.`,
      });
    }
  }
  organisation.isActive = !!isActive;
  return organisationView(organisation);
}

// ---------- venues ----------
const venueView = ({ id, name, location, capacity, isActive }) => ({ id, name, location, capacity, isActive });

function validateVenue({ name, location, capacity }, selfId) {
  const fields = {};
  const text = String(name || '').trim();
  if (text.length < 2 || text.length > 60) fields.name = 'Enter a name of 2 to 60 characters.';
  else if (VENUES.some((v) => v.id !== selfId && v.name.toLowerCase() === text.toLowerCase())) fields.name = 'A venue with this name already exists.';
  if (!String(location || '').trim()) fields.location = 'Enter the building or floor.';
  if (!Number.isInteger(capacity) || capacity < 1) fields.capacity = 'Capacity must be a whole number of at least 1.';
  return fields;
}

// GET /admin/venues (includes inactive)
export async function getVenues() {
  await delay();
  await requireAdmin();
  return VENUES.map(venueView);
}

// POST /admin/venues
export async function createVenue(payload) {
  await delay(400);
  await requireAdmin();
  const fields = validateVenue(payload);
  if (Object.keys(fields).length) throw invalid(fields);
  const venue = { id: `v-new-${VENUES.length + 1}`, name: payload.name.trim(), location: payload.location.trim(), capacity: payload.capacity, isActive: true };
  VENUES.push(venue);
  return venueView(venue);
}

// PUT /admin/venues/:id
export async function updateVenue(id, payload) {
  await delay(400);
  await requireAdmin();
  const venue = VENUES.find((v) => v.id === id);
  if (!venue) throw notFound('venue');
  const fields = validateVenue(payload, id);
  if (Object.keys(fields).length) throw invalid(fields);
  venue.name = payload.name.trim();
  venue.location = payload.location.trim();
  venue.capacity = payload.capacity;
  return venueView(venue);
}

// PATCH /admin/venues/:id/status
export async function setVenueStatus(id, { isActive }) {
  await delay(300);
  await requireAdmin();
  const venue = VENUES.find((v) => v.id === id);
  if (!venue) throw notFound('venue');
  venue.isActive = !!isActive;
  return venueView(venue);
}

// ---------- events ----------
// GET /admin/events?status=  (read only, with history)
export async function getEvents({ status } = {}) {
  await delay();
  await requireAdmin();
  return events
    .filter((ev) => !status || ev.status === status)
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
    .map((ev) => toEventObject(ev, { withHistory: true }));
}
