const mongoose = require('mongoose');
const { Organisation, Venue, Setting, Event, User } = require('../models');
const { CATEGORIES } = require('../models/Organisation');
const { ApiError } = require('../middleware/errorHandler');
const { EVENT_POPULATE, serializeEvent } = require('../utils/serializers');
const {
  PUBLIC_FILTER,
  visibleTo,
  upcomingFilter,
  pastFilter,
  canSeeHistory,
  loadHistory,
} = require('../utils/eventQueries');

const CATEGORY_LABELS = { society: 'Societies', school: 'Schools', department: 'Departments' };
const NOT_FOUND = () => new ApiError(404, 'NOT_FOUND', 'We could not find what you asked for.');

function requireCategory(value) {
  if (typeof value !== 'string' || !CATEGORIES.includes(value)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Choose a category: society, school or department.', {
      category: 'Choose society, school or department.',
    });
  }
  return value;
}

// FR-BRW-01
async function getCategories(req, res) {
  const counts = await Organisation.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', n: { $sum: 1 } } },
  ]);
  const byCategory = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  res.json(
    CATEGORIES.map((key) => ({
      key,
      label: CATEGORY_LABELS[key],
      organisationCount: byCategory[key] || 0,
    }))
  );
}

// FR-BRW-02: active organisations A to Z, with the number of upcoming events
async function listOrganisations(req, res) {
  const category = requireCategory(req.query.category);
  const orgs = await Organisation.find({ category, isActive: true })
    .collation({ locale: 'en', strength: 2 })
    .sort({ name: 1 })
    .lean();

  const ids = orgs.map((o) => o._id);
  const counts = await Event.aggregate([
    { $match: { $and: [{ organisationId: { $in: ids } }, upcomingFilter(), PUBLIC_FILTER] } },
    { $group: { _id: '$organisationId', n: { $sum: 1 } } },
  ]);
  const byOrg = new Map(counts.map((c) => [String(c._id), c.n]));

  res.json(
    orgs.map((o) => ({
      id: String(o._id),
      name: o.name,
      category: o.category,
      upcomingCount: byOrg.get(String(o._id)) || 0,
    }))
  );
}

// FR-BRW-03. Inactive organisations can still be opened (their past events stay visible).
async function getOrganisation(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw NOT_FOUND();
  const org = await Organisation.findById(req.params.id).lean();
  if (!org) throw NOT_FOUND();

  const out = {
    id: String(org._id),
    name: org.name,
    category: org.category,
    description: org.description,
    isActive: org.isActive,
  };

  // Organisers, approvers and admins also get the approver names (screen 12, "Goes to ...").
  const privileged = ['organiser', 'approver', 'admin'].some((r) => req.user.roles.includes(r));
  if (privileged) {
    const approvers = await User.find({
      isActive: true,
      affiliations: { $elemMatch: { organisationId: org._id, type: 'approver' } },
    })
      .select('fullName')
      .sort({ fullName: 1 })
      .lean();
    out.approvers = approvers.map((a) => ({ fullName: a.fullName }));
  }
  res.json(out);
}

// FR-BRW-03, 04, 07
async function listOrganisationEvents(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) throw NOT_FOUND();
  const when = req.query.when === undefined ? 'upcoming' : req.query.when;
  if (when !== 'upcoming' && when !== 'past') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Choose upcoming or past events.', {
      when: 'Use upcoming or past.',
    });
  }
  const org = await Organisation.findById(req.params.id).select('_id').lean();
  if (!org) throw NOT_FOUND();

  const timeFilter = when === 'upcoming' ? upcomingFilter() : pastFilter();
  const events = await Event.find({
    $and: [{ organisationId: org._id }, visibleTo(req.user), timeFilter],
  })
    .sort({ startAt: when === 'upcoming' ? 1 : -1 }) // soonest first / most recent first
    .populate(EVENT_POPULATE);

  res.json(events.map((e) => serializeEvent(e)));
}

// FR-BRW-05, 06. A hidden event looks exactly like a missing one (404).
async function getEvent(req, res, next) {
  // Not an event id (for example /events/conflict-check): let the next router handle it.
  if (!mongoose.isValidObjectId(req.params.id)) return next();

  const event = await Event.findOne({
    $and: [{ _id: req.params.id }, visibleTo(req.user)],
  }).populate(EVENT_POPULATE);
  if (!event) throw new ApiError(404, 'NOT_FOUND', 'This event could not be found.');

  let history;
  if (canSeeHistory(req.user, event.organisationId._id)) {
    const map = await loadHistory([event._id]);
    history = map.get(String(event._id)) || [];
  }
  return res.json(serializeEvent(event, history));
}

// FR-SUB-02: active venues for the event form
async function listVenues(req, res) {
  const venues = await Venue.find({ isActive: true })
    .collation({ locale: 'en', strength: 2 })
    .sort({ name: 1 })
    .lean();
  res.json(
    venues.map((v) => ({ id: String(v._id), name: v.name, location: v.location, capacity: v.capacity }))
  );
}

// FR-SUB-03: event types allowed for one category, as a plain list of names
async function getEventTypes(req, res) {
  const category = requireCategory(req.query.category);
  const settings = await Setting.findOne().lean();
  res.json((settings && settings.eventTypes && settings.eventTypes[category]) || []);
}

module.exports = {
  getCategories,
  listOrganisations,
  getOrganisation,
  listOrganisationEvents,
  getEvent,
  listVenues,
  getEventTypes,
};
