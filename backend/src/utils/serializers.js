// Turns database documents into the JSON shapes defined in Section 6.1 of the
// Sprint 1 Master Document. Shared by the Browse, Approvals and Admin APIs.

const idOf = (value) => (value ? String(value._id || value) : null);

// Pass these to .populate() so serializeEvent has names to show.
const EVENT_POPULATE = [
  { path: 'organisationId', select: 'name category' },
  { path: 'venueId', select: 'name capacity' },
  { path: 'createdBy', select: 'fullName' },
];

function serializeVenue(venue) {
  if (!venue || !venue.name) return null; // online event, or venue not populated
  return { id: String(venue._id), name: venue.name, capacity: venue.capacity };
}

function serializeHistoryEntry(entry) {
  return {
    fromStatus: entry.fromStatus || null,
    toStatus: entry.toStatus,
    actor: entry.actorId
      ? { id: idOf(entry.actorId), fullName: entry.actorId.fullName || null }
      : null,
    actorRole: entry.actorRole,
    comment: entry.comment || '',
    createdAt: entry.createdAt.toISOString(),
  };
}

// event must be populated with EVENT_POPULATE. Pass history (array of
// serializeHistoryEntry results) only when the caller is allowed to see it.
function serializeEvent(event, history) {
  const org = event.organisationId && event.organisationId.name ? event.organisationId : null;
  const creator = event.createdBy && event.createdBy.fullName ? event.createdBy : null;
  const out = {
    id: String(event._id),
    organisationId: idOf(event.organisationId),
    organisationName: org ? org.name : null,
    category: org ? org.category : null,
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    isOnline: event.isOnline,
    venue: event.isOnline ? null : serializeVenue(event.venueId),
    capacity: event.capacity,
    registrationRequired: event.registrationRequired,
    attendanceEnabled: event.attendanceEnabled,
    speakerName: event.speakerName || null,
    speakerDesignation: event.speakerDesignation || null,
    presenterName: event.presenterName || null,
    thesisTitle: event.thesisTitle || null,
    supervisorName: event.supervisorName || null,
    status: event.status,
    cancelledAfterApproval: event.cancelledAfterApproval,
    cancellationReason: event.cancellationReason || null,
    createdBy: { id: idOf(event.createdBy), fullName: creator ? creator.fullName : null },
    createdAt: event.createdAt.toISOString(),
  };
  if (history) out.history = history;
  return out;
}

// user must be loaded with .populate('affiliations.organisationId', 'name category').
function serializeUser(user) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    roles: user.roles,
    affiliations: user.affiliations
      .filter((a) => a.organisationId && a.organisationId.name)
      .map((a) => ({
        organisationId: String(a.organisationId._id),
        organisationName: a.organisationId.name,
        category: a.organisationId.category,
        type: a.type,
      })),
    isActive: user.isActive,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

module.exports = {
  EVENT_POPULATE,
  serializeEvent,
  serializeHistoryEntry,
  serializeUser,
  serializeVenue,
  idOf,
};
