import { ApiError } from '../ApiError';
import { extraFieldsFor } from '../../utils/eventForm';
import { formatDate, formatTime, isSamePakistanDay } from '../../utils/dates';
import { getCurrentUser } from './mockAuth';
import { EVENT_TYPES, VENUES, canSeeHistory, events, findOrg, findVenue, toEventObject } from './mockData';
import { delay } from './mockUtils';

// Mock versions of the organiser endpoints (Master Document 6.4) and the form lists (6.3).
// They copy the server rules from Sections 5.7, 5.9 and 5.10, so the app can be built and
// tested before the API exists.

const BLOCKING = ['PENDING', 'CHANGES_REQUESTED', 'APPROVED']; // statuses that hold a venue slot (D1)

const forbidden = (message) => new ApiError({ status: 403, code: 'FORBIDDEN', message });
const notFound = () =>
  new ApiError({ status: 404, code: 'NOT_FOUND', message: 'We could not find that event. Go back and try again.' });

const isOrganiserOf = (user, organisationId) =>
  user.affiliations.some((a) => a.organisationId === organisationId && a.type === 'organiser');

async function requireOrganiser() {
  const user = await getCurrentUser();
  if (!user.roles.includes('organiser')) throw forbidden('You do not have permission to do that.');
  return user;
}

// Does another event hold this venue at an overlapping time? (Section 5.10)
function findClash({ venueId, startAt, endAt, excludeId }) {
  if (!venueId) return null; // online events never conflict
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);
  return (
    events.find(
      (ev) =>
        ev.venueId === venueId &&
        ev.id !== excludeId &&
        BLOCKING.includes(ev.status) &&
        Date.parse(ev.startAt) < end &&
        Date.parse(ev.endAt) > start
    ) || null
  );
}

function clashMessage(ev) {
  const organisation = findOrg(ev.organisationId);
  return `This venue is already booked for ${ev.title} (${organisation ? organisation.name : ''}) from ${formatTime(ev.startAt)} to ${formatTime(ev.endAt)} on ${formatDate(ev.startAt)}. Please choose another time or venue.`;
}

function validate(payload, organisation) {
  const fields = {};
  const title = String(payload.title || '').trim();
  if (!title) fields.title = 'Enter a title for the event.';
  else if (title.length > 100) fields.title = 'The title can have at most 100 characters.';
  const description = String(payload.description || '').trim();
  if (!description) fields.description = 'Enter a description of the event.';
  else if (description.length > 2000) fields.description = 'The description can have at most 2000 characters.';
  if (!EVENT_TYPES[organisation.category].includes(payload.eventType)) {
    fields.eventType = 'This event type is not available for the organisation.';
  }

  const start = Date.parse(payload.startAt);
  const end = Date.parse(payload.endAt);
  if (Number.isNaN(start)) fields.startAt = 'Choose a start time.';
  if (Number.isNaN(end)) fields.endAt = 'Choose an end time.';
  if (!fields.startAt && !fields.endAt) {
    if (end <= start) fields.endAt = 'The end time must be after the start time.';
    else if (!isSamePakistanDay(payload.startAt, payload.endAt)) fields.endAt = 'The event must start and end on the same day.';
    if (start <= Date.now()) fields.startAt = 'The start time must be in the future.';
  }

  let venue = null;
  if (!payload.isOnline) {
    venue = payload.venueId ? findVenue(payload.venueId) : null;
    if (!venue || !venue.isActive) fields.venueId = 'Choose an available venue, or choose Online.';
  }
  const capacity = payload.capacity;
  if (!Number.isInteger(capacity) || capacity < 1) fields.capacity = 'Capacity must be a whole number of at least 1.';
  else if (venue && capacity > venue.capacity) {
    fields.capacity = `This venue holds at most ${venue.capacity} people. Enter ${venue.capacity} or fewer.`;
  }

  const extra = extraFieldsFor(payload.eventType);
  const need = (key, message) => {
    if (!String(payload[key] || '').trim()) fields[key] = message;
  };
  if (extra === 'speaker') {
    need('speakerName', 'Enter the speaker name.');
    need('speakerDesignation', 'Enter the speaker designation.');
  }
  if (extra === 'thesis') {
    need('presenterName', 'Enter the presenter name.');
    need('thesisTitle', 'Enter the thesis title.');
    need('supervisorName', 'Enter the supervisor name.');
  }
  return fields;
}

const validationError = (fields) =>
  new ApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Some details need fixing. Check the highlighted fields and try again.', fields });

const conflictError = (ev) => new ApiError({ status: 409, code: 'VENUE_CONFLICT', message: clashMessage(ev) });

function applyFields(ev, payload) {
  ev.title = payload.title.trim();
  ev.description = payload.description.trim();
  ev.eventType = payload.eventType;
  ev.startAt = payload.startAt;
  ev.endAt = payload.endAt;
  ev.isOnline = !!payload.isOnline;
  ev.venueId = payload.isOnline ? null : payload.venueId;
  ev.capacity = payload.capacity;
  ev.registrationRequired = !!payload.registrationRequired;
  ev.attendanceEnabled = !!payload.attendanceEnabled;
  const extra = extraFieldsFor(payload.eventType);
  ev.speakerName = extra === 'speaker' ? payload.speakerName.trim() : '';
  ev.speakerDesignation = extra === 'speaker' ? payload.speakerDesignation.trim() : '';
  ev.presenterName = extra === 'thesis' ? payload.presenterName.trim() : '';
  ev.thesisTitle = extra === 'thesis' ? payload.thesisTitle.trim() : '';
  ev.supervisorName = extra === 'thesis' ? payload.supervisorName.trim() : '';
}

function addHistory(ev, user, fromStatus, toStatus, comment = '') {
  ev.history.push({
    fromStatus,
    toStatus,
    actor: { id: user.id, fullName: user.fullName },
    actorRole: 'organiser',
    comment,
    createdAt: new Date().toISOString(),
  });
}

// GET /venues (active venues for the form)
export async function getVenues() {
  await delay(250);
  await getCurrentUser();
  return VENUES.filter((v) => v.isActive).map(({ id, name, location, capacity }) => ({ id, name, location, capacity }));
}

// GET /settings/event-types?category=school
export async function getEventTypes(category) {
  await delay(200);
  await getCurrentUser();
  return EVENT_TYPES[category] || [];
}

// GET /events/conflict-check
export async function getConflict({ venueId, startAt, endAt, excludeEventId }) {
  await delay(300);
  await requireOrganiser();
  if (!venueId || Number.isNaN(Date.parse(startAt)) || Number.isNaN(Date.parse(endAt))) {
    throw validationError({ venueId: 'Choose a venue, date and times first.' });
  }
  const clash = findClash({ venueId, startAt, endAt, excludeId: excludeEventId });
  if (!clash) return { conflict: false };
  const organisation = findOrg(clash.organisationId);
  return {
    conflict: true,
    clashingEvent: {
      id: clash.id,
      title: clash.title,
      organisationName: organisation ? organisation.name : '',
      startAt: clash.startAt,
      endAt: clash.endAt,
      status: clash.status,
    },
  };
}

// POST /events
export async function createEvent(payload) {
  await delay(500);
  const user = await requireOrganiser();
  const organisation = findOrg(payload.organisationId);
  if (!organisation) throw validationError({ organisationId: 'Choose the organisation this event is for.' });
  if (!isOrganiserOf(user, organisation.id)) throw forbidden('You can only create events for your own organisation.');
  const fields = validate(payload, organisation);
  if (Object.keys(fields).length) throw validationError(fields);
  if (!payload.isOnline) {
    const clash = findClash({ venueId: payload.venueId, startAt: payload.startAt, endAt: payload.endAt });
    if (clash) throw conflictError(clash);
  }

  const ev = {
    id: `ev-new-${events.length + 1}`,
    organisationId: organisation.id,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    cancelledAfterApproval: false,
    cancellationReason: null,
    history: [],
  };
  applyFields(ev, payload);
  addHistory(ev, user, null, 'PENDING');
  events.push(ev);
  return toEventObject(ev, { withHistory: true });
}

// GET /my/events
export async function getMyEvents() {
  await delay();
  const user = await requireOrganiser();
  return events
    .filter((ev) => isOrganiserOf(user, ev.organisationId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((ev) => toEventObject(ev));
}

function ownEvent(user, id) {
  const ev = events.find((item) => item.id === id);
  if (!ev || !canSeeHistory(user, ev)) throw notFound();
  if (!isOrganiserOf(user, ev.organisationId)) throw forbidden('You can only manage events of your own organisation.');
  return ev;
}

const invalidStatus = (message) => new ApiError({ status: 409, code: 'INVALID_STATUS', message });

// PUT /events/:id (only while Changes Requested)
export async function updateEvent(id, payload) {
  await delay(500);
  const user = await requireOrganiser();
  const ev = ownEvent(user, id);
  if (ev.status !== 'CHANGES_REQUESTED') {
    throw invalidStatus('This event cannot be edited now. Only events with requested changes can be edited.');
  }
  const organisation = findOrg(ev.organisationId);
  const fields = validate(payload, organisation);
  if (Object.keys(fields).length) throw validationError(fields);
  if (!payload.isOnline) {
    const clash = findClash({ venueId: payload.venueId, startAt: payload.startAt, endAt: payload.endAt, excludeId: ev.id });
    if (clash) throw conflictError(clash);
  }
  applyFields(ev, payload);
  return toEventObject(ev, { withHistory: true });
}

// POST /events/:id/resubmit
export async function resubmitEvent(id) {
  await delay(400);
  const user = await requireOrganiser();
  const ev = ownEvent(user, id);
  if (ev.status !== 'CHANGES_REQUESTED') throw invalidStatus('Only events with requested changes can be resubmitted.');
  const clash = findClash({ venueId: ev.venueId, startAt: ev.startAt, endAt: ev.endAt, excludeId: ev.id });
  if (clash) throw conflictError(clash);
  ev.status = 'PENDING';
  addHistory(ev, user, 'CHANGES_REQUESTED', 'PENDING');
  return toEventObject(ev, { withHistory: true });
}

// POST /events/:id/cancel
export async function cancelEvent(id, { reason } = {}) {
  await delay(400);
  const user = await requireOrganiser();
  const ev = ownEvent(user, id);
  if (!['PENDING', 'CHANGES_REQUESTED', 'APPROVED'].includes(ev.status)) {
    throw invalidStatus('This event cannot be cancelled now.');
  }
  const wasApproved = ev.status === 'APPROVED';
  const text = String(reason || '').trim();
  if (wasApproved && text.length < 10) {
    throw validationError({ reason: 'Enter a reason of at least 10 characters. Students will see that the event was cancelled.' });
  }
  const previous = ev.status;
  ev.status = 'CANCELLED';
  ev.cancelledAfterApproval = wasApproved;
  ev.cancellationReason = text || null;
  addHistory(ev, user, previous, 'CANCELLED', text);
  return toEventObject(ev, { withHistory: true });
}
