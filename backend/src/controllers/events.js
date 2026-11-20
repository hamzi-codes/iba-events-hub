const mongoose = require('mongoose');
const Event = require('../models/Event');
const EventHistory = require('../models/EventHistory');
const Organisation = require('../models/Organisation');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { hasAffiliation, affiliatedOrgIds } = require('../middleware/roles');
const { validateEventInput } = require('../services/eventRules');
const { findConflict, conflictMessage, withVenueLock } = require('../services/conflict');

const VALIDATION_MESSAGE = 'Some details need fixing. Check the highlighted fields and try again.';

const POPULATE = [
  { path: 'organisationId', select: 'name category' },
  { path: 'venueId', select: 'name capacity' },
  { path: 'createdBy', select: 'fullName' },
];

// ---------- response helpers (Danial can reuse serializeEvent and historyFor) ----------

// The Event object from Section 6.1. The event must be populated.
function serializeEvent(e, history) {
  const org = e.organisationId;
  const venue = e.venueId;
  const creator = e.createdBy;
  const out = {
    id: e.id,
    organisationId: org ? org.id : null,
    organisationName: org ? org.name : null,
    category: org ? org.category : null,
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    isOnline: e.isOnline,
    venue: venue ? { id: venue.id, name: venue.name, capacity: venue.capacity } : null,
    capacity: e.capacity,
    registrationRequired: e.registrationRequired,
    attendanceEnabled: e.attendanceEnabled,
    speakerName: e.speakerName,
    speakerDesignation: e.speakerDesignation,
    presenterName: e.presenterName,
    thesisTitle: e.thesisTitle,
    supervisorName: e.supervisorName,
    status: e.status,
    cancelledAfterApproval: e.cancelledAfterApproval,
    cancellationReason: e.cancellationReason,
    createdBy: creator ? { id: creator.id, fullName: creator.fullName } : null,
    createdAt: e.createdAt.toISOString(),
  };
  if (history) out.history = history;
  return out;
}

// History entries from Section 6.1, oldest first
async function historyFor(eventId) {
  const entries = await EventHistory.find({ eventId })
    .sort({ createdAt: 1, _id: 1 })
    .populate('actorId', 'fullName');
  return entries.map((h) => ({
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    actor: h.actorId ? { id: h.actorId.id, fullName: h.actorId.fullName } : null,
    actorRole: h.actorRole,
    comment: h.comment,
    createdAt: h.createdAt.toISOString(),
  }));
}

// A single event with its history, for organiser responses
async function respond(event) {
  await event.populate(POPULATE);
  return serializeEvent(event, await historyFor(event._id));
}

// ---------- guards ----------

function throwIfFields(fields) {
  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', VALIDATION_MESSAGE, fields);
  }
}

// The caller must be an organiser of this organisation (NFR-SEC-03)
async function organisationForCreate(user, organisationId) {
  if (typeof organisationId !== 'string' || !mongoose.isValidObjectId(organisationId)) {
    throw new ApiError(400, 'VALIDATION_ERROR', VALIDATION_MESSAGE, { organisationId: 'Choose an organisation.' });
  }
  const notAllowed = new ApiError(
    403,
    'FORBIDDEN',
    'You can only create events for organisations you are linked to.'
  );
  if (!hasAffiliation(user, organisationId, 'organiser')) throw notAllowed;
  const organisation = await Organisation.findById(organisationId);
  if (!organisation) throw notAllowed;
  if (!organisation.isActive) {
    throw new ApiError(400, 'VALIDATION_ERROR', VALIDATION_MESSAGE, {
      organisationId: 'This organisation is not active.',
    });
  }
  return organisation;
}

async function ownEvent(user, id) {
  const event = await Event.findById(id);
  if (!event) throw new ApiError(404, 'NOT_FOUND', 'We could not find that event.');
  if (!hasAffiliation(user, event.organisationId, 'organiser')) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only manage events of organisations you are linked to.');
  }
  return event;
}

const invalidStatus = (message) => new ApiError(409, 'INVALID_STATUS', message);

// ---------- handlers ----------

// GET /events/conflict-check  (FR-CNF-01, 02)
const conflictCheck = asyncHandler(async (req, res) => {
  const { venueId, startAt, endAt, excludeEventId } = req.query;
  const clash = await findConflict({
    venueId,
    startAt: new Date(startAt),
    endAt: new Date(endAt),
    excludeEventId,
  });
  if (!clash) return res.json({ conflict: false });
  return res.json({
    conflict: true,
    clashingEvent: {
      id: clash.id,
      title: clash.title,
      organisationName: clash.organisationId ? clash.organisationId.name : null,
      startAt: clash.startAt.toISOString(),
      endAt: clash.endAt.toISOString(),
      status: clash.status,
    },
  });
});

// POST /events  (FR-SUB-01 to 06, ATT-01)
const createEvent = asyncHandler(async (req, res) => {
  const organisation = await organisationForCreate(req.user, req.body.organisationId);
  const { fields, data } = await validateEventInput(req.body, organisation);
  throwIfFields(fields);

  const event = await withVenueLock(data.venueId, async () => {
    const clash = await findConflict({ venueId: data.venueId, startAt: data.startAt, endAt: data.endAt });
    if (clash) throw new ApiError(409, 'VENUE_CONFLICT', conflictMessage(clash));

    const created = await Event.create({
      ...data,
      organisationId: organisation._id,
      createdBy: req.user._id,
      status: 'PENDING',
    });
    await EventHistory.create({
      eventId: created._id,
      fromStatus: null,
      toStatus: 'PENDING',
      actorId: req.user._id,
      actorRole: 'organiser',
      comment: '',
    });
    return created;
  });

  res.status(201).json(await respond(event));
});

// GET /my/events?status=  (FR-SUB-07)
const myEvents = asyncHandler(async (req, res) => {
  const filter = { organisationId: { $in: affiliatedOrgIds(req.user, 'organiser') } };
  if (req.query.status) filter.status = req.query.status;

  const events = await Event.find(filter).sort({ createdAt: -1 }).populate(POPULATE);
  res.json({ total: events.length, events: events.map((e) => serializeEvent(e)) });
});

// PUT /events/:id  (FR-SUB-08): only after changes were requested
const updateEvent = asyncHandler(async (req, res) => {
  const event = await ownEvent(req.user, req.params.id);
  if (event.status !== 'CHANGES_REQUESTED') {
    throw invalidStatus('Only events where changes were requested can be edited.');
  }

  const organisation = await Organisation.findById(event.organisationId); // the organisation cannot change
  const { fields, data } = await validateEventInput(req.body, organisation);
  throwIfFields(fields);

  const updated = await withVenueLock(data.venueId, async () => {
    const clash = await findConflict({
      venueId: data.venueId,
      startAt: data.startAt,
      endAt: data.endAt,
      excludeEventId: event._id, // ignore the event itself
    });
    if (clash) throw new ApiError(409, 'VENUE_CONFLICT', conflictMessage(clash));

    const saved = await Event.findOneAndUpdate(
      { _id: event._id, status: 'CHANGES_REQUESTED' },
      { $set: data },
      { new: true }
    );
    if (!saved) throw invalidStatus('Only events where changes were requested can be edited.');
    return saved;
  });

  res.json(await respond(updated));
});

// POST /events/:id/resubmit  (FR-APR-07)
const resubmitEvent = asyncHandler(async (req, res) => {
  const event = await ownEvent(req.user, req.params.id);
  if (event.status !== 'CHANGES_REQUESTED') {
    throw invalidStatus('Only events where changes were requested can be resubmitted.');
  }

  const resubmitted = await withVenueLock(event.venueId, async () => {
    const clash = await findConflict({
      venueId: event.venueId,
      startAt: event.startAt,
      endAt: event.endAt,
      excludeEventId: event._id,
    });
    if (clash) throw new ApiError(409, 'VENUE_CONFLICT', conflictMessage(clash));

    return Event.findOneAndUpdate(
      { _id: event._id, status: 'CHANGES_REQUESTED' },
      { status: 'PENDING' },
      { new: true }
    );
  });
  if (!resubmitted) throw invalidStatus('Only events where changes were requested can be resubmitted.');

  await EventHistory.create({
    eventId: resubmitted._id,
    fromStatus: 'CHANGES_REQUESTED',
    toStatus: 'PENDING',
    actorId: req.user._id,
    actorRole: 'organiser',
    comment: '',
  });
  res.json(await respond(resubmitted));
});

// POST /events/:id/cancel  (FR-SUB-10)
const cancelEvent = asyncHandler(async (req, res) => {
  const event = await ownEvent(req.user, req.params.id);
  const cancellable = ['PENDING', 'CHANGES_REQUESTED', 'APPROVED'];
  if (!cancellable.includes(event.status)) {
    throw invalidStatus('This event can no longer be cancelled.');
  }

  const previous = event.status;
  const wasApproved = previous === 'APPROVED';
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (wasApproved && reason.length < 10) {
    throw new ApiError(400, 'VALIDATION_ERROR', VALIDATION_MESSAGE, {
      reason: 'Give a reason of at least 10 characters.',
    });
  }

  const cancelled = await Event.findOneAndUpdate(
    { _id: event._id, status: previous },
    { status: 'CANCELLED', cancelledAfterApproval: wasApproved, cancellationReason: reason || null },
    { new: true }
  );
  if (!cancelled) throw invalidStatus('This event can no longer be cancelled.');

  await EventHistory.create({
    eventId: cancelled._id,
    fromStatus: previous,
    toStatus: 'CANCELLED',
    actorId: req.user._id,
    actorRole: 'organiser',
    comment: reason,
  });
  res.json(await respond(cancelled));
});

module.exports = {
  conflictCheck,
  createEvent,
  myEvents,
  updateEvent,
  resubmitEvent,
  cancelEvent,
  serializeEvent,
  historyFor,
};