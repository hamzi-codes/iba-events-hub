const Event = require('../models/Event');
const { formatDate, formatTime } = require('./eventRules');

// Events that block a venue (decision D1). Rejected and cancelled do not.
const BLOCKING_STATUSES = ['PENDING', 'CHANGES_REQUESTED', 'APPROVED'];

// Returns the clashing event (with its organisation) or null.
// Online events have no venueId, so they never clash.
async function findConflict({ venueId, startAt, endAt, excludeEventId }) {
  if (!venueId) return null;
  const query = {
    venueId,
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: endAt }, // starts before the new one ends
    endAt: { $gt: startAt }, // ends after the new one starts
  };
  if (excludeEventId) query._id = { $ne: excludeEventId };
  return Event.findOne(query).populate('organisationId', 'name');
}

function conflictMessage(clash) {
  const org = clash.organisationId ? clash.organisationId.name : 'another organisation';
  return (
    `This venue is already booked for ${clash.title} (${org}) from ` +
    `${formatTime(clash.startAt)} to ${formatTime(clash.endAt)} on ${formatDate(clash.startAt)}. ` +
    'Please choose another time or venue.'
  );
}

// A simple per-venue lock in memory (fine for one server). Two requests for the
// same venue run one after the other, so the check and the save cannot interleave.
const locks = new Map();

async function withVenueLock(venueId, fn) {
  if (!venueId) return fn();
  const key = String(venueId);
  const previous = locks.get(key) || Promise.resolve();
  let release;
  const mine = new Promise((resolve) => {
    release = resolve;
  });
  const chain = previous.then(() => mine);
  locks.set(key, chain);

  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === chain) locks.delete(key);
  }
}

module.exports = { findConflict, conflictMessage, withVenueLock, BLOCKING_STATUSES };