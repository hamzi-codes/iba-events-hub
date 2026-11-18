const mongoose = require('mongoose');
const { Event, EventHistory } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { hasAffiliation, affiliatedOrgIds } = require('../middleware/roles');
const { EVENT_POPULATE, serializeEvent } = require('../utils/serializers');
const { loadHistory } = require('../utils/eventQueries');

const DECISIONS = ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'];
const BLOCKING_STATUSES = ['PENDING', 'CHANGES_REQUESTED', 'APPROVED']; // decision D1
const MIN_COMMENT = 10;
const MAX_COMMENT = 1000;
const NOT_FOUND = () => new ApiError(404, 'NOT_FOUND', 'This event could not be found.');

// ---------- small helpers ----------

// A date-only value such as 2026-11-24 means that day in Pakistan time (UTC+5).
function parseDateParam(value, name, endOfDay) {
  if (value === undefined) return null;
  const bad = () =>
    new ApiError(400, 'VALIDATION_ERROR', `The ${name} date is not valid. Use a date like 2026-11-24.`, {
      [name]: 'Use a date like 2026-11-24.',
    });
  if (typeof value !== 'string') throw bad();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = new Date(dateOnly ? `${value}T00:00:00+05:00` : value);
  if (Number.isNaN(d.getTime())) throw bad();
  return dateOnly && endOfDay ? new Date(d.getTime() + 24 * 3600e3 - 1) : d;
}

const timeFmt = (d) =>
  d.toLocaleTimeString('en-US', { timeZone: 'Asia/Karachi', hour: 'numeric', minute: '2-digit', hour12: true });
const dateFmt = (d) =>
  d.toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short', year: 'numeric' });

// Safety re-check just before approval (FR-CNF-05). Same rule as Section 5.10.
// TODO: when services/conflict.js from Ali is merged, call it here instead of this copy.
async function findClash(event) {
  if (event.isOnline || !event.venueId) return null; // online events never conflict
  return Event.findOne({
    venueId: event.venueId._id || event.venueId,
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: event.endAt },
    endAt: { $gt: event.startAt },
    _id: { $ne: event._id },
  }).populate('organisationId', 'name');
}

function readComment(body, required) {
  const raw = body && body.comment;
  if (raw !== undefined && raw !== null && typeof raw !== 'string') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'The comment must be text.', { comment: 'Enter text only.' });
  }
  const comment = (raw || '').trim();
  if (required && comment.length < MIN_COMMENT) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      `Please write a comment of at least ${MIN_COMMENT} characters so the organiser knows why.`,
      { comment: `Write at least ${MIN_COMMENT} characters.` }
    );
  }
  if (comment.length > MAX_COMMENT) {
    throw new ApiError(400, 'VALIDATION_ERROR', `The comment is too long (maximum ${MAX_COMMENT} characters).`, {
      comment: `Use at most ${MAX_COMMENT} characters.`,
    });
  }
  return comment;
}

async function respondWithEvent(res, eventId) {
  const event = await Event.findById(eventId).populate(EVENT_POPULATE);
  const history = (await loadHistory([event._id])).get(String(event._id)) || [];
  return res.json(serializeEvent(event, history));
}

// ---------- queue and history lists ----------

// FR-APR-02: pending events of the approver's organisations, oldest first
async function getPending(req, res) {
  const orgIds = affiliatedOrgIds(req.user, 'approver');
  const events = await Event.find({ status: 'PENDING', organisationId: { $in: orgIds } })
    .sort({ updatedAt: 1, _id: 1 }) // updatedAt = when it entered the queue (also for resubmissions)
    .populate(EVENT_POPULATE);
  res.json({ total: events.length, events: events.map((e) => serializeEvent(e)) });
}

// FR-APR-10: decisions already made on the approver's organisations, newest first.
// One row per decision: the event plus a "decision" block.
async function getDecided(req, res) {
  const { decision } = req.query;
  if (decision !== undefined && !DECISIONS.includes(decision)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Choose APPROVED, REJECTED or CHANGES_REQUESTED.', {
      decision: 'Use APPROVED, REJECTED or CHANGES_REQUESTED.',
    });
  }
  const from = parseDateParam(req.query.from, 'from', false);
  const to = parseDateParam(req.query.to, 'to', true);

  const orgIds = affiliatedOrgIds(req.user, 'approver');
  const eventIds = await Event.find({ organisationId: { $in: orgIds } }).distinct('_id');

  const filter = {
    eventId: { $in: eventIds },
    fromStatus: 'PENDING',
    toStatus: decision ? decision : { $in: DECISIONS },
  };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = from;
    if (to) filter.createdAt.$lte = to;
  }
  const entries = await EventHistory.find(filter).sort({ createdAt: -1, _id: -1 }).populate('actorId', 'fullName');

  const events = await Event.find({ _id: { $in: entries.map((e) => e.eventId) } }).populate(EVENT_POPULATE);
  const byId = new Map(events.map((e) => [String(e._id), e]));

  res.json(
    entries
      .filter((entry) => byId.has(String(entry.eventId)))
      .map((entry) => ({
        ...serializeEvent(byId.get(String(entry.eventId))),
        decision: {
          status: entry.toStatus,
          comment: entry.comment || '',
          decidedAt: entry.createdAt.toISOString(),
          decidedBy: entry.actorId ? { id: String(entry.actorId._id), fullName: entry.actorId.fullName } : null,
        },
      }))
  );
}

// ---------- decisions ----------

// opts: { toStatus, commentRequired, isApprove }
async function decide(req, res, opts) {
  const { eventId } = req.params;
  if (!mongoose.isValidObjectId(eventId)) throw NOT_FOUND();

  const event = await Event.findById(eventId).populate(EVENT_POPULATE);
  if (!event) throw NOT_FOUND();

  // FR-APR-09 / BR-03: only an approver linked to this event's organisation
  if (!hasAffiliation(req.user, event.organisationId._id, 'approver')) {
    throw new ApiError(403, 'FORBIDDEN', 'You can only decide on events of organisations you approve for.');
  }
  // Decision D4: nobody decides on their own event
  if (String(event.createdBy._id) === String(req.user._id)) {
    throw new ApiError(403, 'SELF_APPROVAL_NOT_ALLOWED', 'You cannot decide on an event you created.');
  }

  const comment = readComment(req.body, opts.commentRequired);

  if (event.status === 'CANCELLED') {
    throw new ApiError(409, 'INVALID_STATUS', 'This event was cancelled, so it no longer needs a decision.');
  }
  if (event.status !== 'PENDING') {
    throw new ApiError(409, 'ALREADY_DECIDED', 'A decision has already been recorded for this event.');
  }

  if (opts.isApprove) {
    if (event.startAt <= new Date()) {
      throw new ApiError(
        400,
        'EVENT_ALREADY_STARTED',
        'This event has already started, so it cannot be approved. Reject it or request changes instead.'
      );
    }
    const clash = await findClash(event);
    if (clash) {
      throw new ApiError(
        409,
        'VENUE_CONFLICT',
        `This venue is already booked for ${clash.title} (${clash.organisationId.name}) from ` +
          `${timeFmt(clash.startAt)} to ${timeFmt(clash.endAt)} on ${dateFmt(clash.startAt)}. ` +
          'The event cannot be approved while this clash exists.'
      );
    }
  }

  // FR-APR-09: one atomic update that only works while the event is still PENDING,
  // so if two approvers click at once only one of them wins.
  const updated = await Event.findOneAndUpdate(
    { _id: event._id, status: 'PENDING' },
    { $set: { status: opts.toStatus } },
    { new: true }
  );
  if (!updated) {
    throw new ApiError(409, 'ALREADY_DECIDED', 'A decision has already been recorded for this event.');
  }

  // FR-APR-08: permanent history entry. If it cannot be written, undo the status change.
  try {
    await EventHistory.create({
      eventId: event._id,
      fromStatus: 'PENDING',
      toStatus: opts.toStatus,
      actorId: req.user._id,
      actorRole: 'approver',
      comment,
    });
  } catch (err) {
    await Event.updateOne({ _id: event._id, status: opts.toStatus }, { $set: { status: 'PENDING' } });
    throw err;
  }

  return respondWithEvent(res, event._id);
}

const approve = (req, res) => decide(req, res, { toStatus: 'APPROVED', commentRequired: false, isApprove: true });
const reject = (req, res) => decide(req, res, { toStatus: 'REJECTED', commentRequired: true, isApprove: false });
const requestChanges = (req, res) =>
  decide(req, res, { toStatus: 'CHANGES_REQUESTED', commentRequired: true, isApprove: false });

module.exports = { getPending, getDecided, approve, reject, requestChanges };
