// Shared rules for "which events may this person see" (Section 5.8) and for
// "upcoming" versus "past". Keep these in one place so every API agrees.

const { EventHistory } = require('../models');
const { serializeHistoryEntry } = require('./serializers');

// What any logged-in user may see (FR-BRW-06, BR-01): approved events, plus
// events cancelled after approval (shown with a Cancelled label).
const PUBLIC_FILTER = {
  $or: [{ status: 'APPROVED' }, { status: 'CANCELLED', cancelledAfterApproval: true }],
};

// Section 5.8: admin sees every event. An organiser or approver also sees every
// status for the organisations they are linked to. Everyone else sees public ones.
function visibleTo(user) {
  if (user.roles.includes('admin')) return {};
  const orgIds = user.affiliations.map((a) => a.organisationId);
  if (orgIds.length === 0) return PUBLIC_FILTER;
  return { $or: [...PUBLIC_FILTER.$or, { organisationId: { $in: orgIds } }] };
}

// "Upcoming" means the event has not ended yet (includes events in progress).
const upcomingFilter = (now = new Date()) => ({ endAt: { $gt: now } });
const pastFilter = (now = new Date()) => ({ endAt: { $lte: now } });

// History is only shown to admin and to people linked to that organisation (6.3).
function canSeeHistory(user, organisationId) {
  if (user.roles.includes('admin')) return true;
  return user.affiliations.some((a) => String(a.organisationId) === String(organisationId));
}

// Returns a Map: eventId (string) -> serialized history entries, oldest first.
async function loadHistory(eventIds) {
  const entries = await EventHistory.find({ eventId: { $in: eventIds } })
    .sort({ createdAt: 1, _id: 1 })
    .populate('actorId', 'fullName');
  const byEvent = new Map();
  entries.forEach((entry) => {
    const key = String(entry.eventId);
    if (!byEvent.has(key)) byEvent.set(key, []);
    byEvent.get(key).push(serializeHistoryEntry(entry));
  });
  return byEvent;
}

module.exports = { PUBLIC_FILTER, visibleTo, upcomingFilter, pastFilter, canSeeHistory, loadHistory };
