import { toDateString, toTimeString, toUtcIso } from './dates';

// Rules and helpers for the event form (Master Document 5.9, FR-SUB-02 to 05).
// The server checks everything again, so these only save the user a round trip.

export const ONLINE = 'online'; // value of the Venue dropdown for an online event

export const SPEAKER_TYPES = ['Guest Speaker Session', 'Faculty Talk', 'Faculty Research Presentation', 'Book Launch'];
export const THESIS_TYPES = ['Thesis Defence', 'PhD Presentation'];

// Which extra fields an event type needs: 'speaker', 'thesis' or null (FR-SUB-04).
export const extraFieldsFor = (eventType) =>
  SPEAKER_TYPES.includes(eventType) ? 'speaker' : THESIS_TYPES.includes(eventType) ? 'thesis' : null;

export const EMPTY_FORM = {
  organisationId: '',
  organisationName: '',
  category: '',
  eventType: '',
  title: '',
  description: '',
  date: '', // "2026-11-24"
  startTime: '', // "17:00"
  endTime: '',
  venueChoice: '', // venue id, or ONLINE
  venueName: '',
  venueCapacity: null,
  capacity: '',
  registrationRequired: false,
  attendanceEnabled: false,
  speakerName: '',
  speakerDesignation: '',
  presenterName: '',
  thesisTitle: '',
  supervisorName: '',
};

const blank = (value) => !String(value ?? '').trim();

// Step 1 of 2: organisation, type, title, description.
export function validateBasics(form, allowedTypes = []) {
  const errors = {};
  if (!form.organisationId) errors.organisationId = 'Choose the organisation this event is for.';
  if (!form.eventType) errors.eventType = 'Choose an event type.';
  else if (allowedTypes.length > 0 && !allowedTypes.includes(form.eventType)) {
    errors.eventType = 'This event type is not available for your organisation. Choose another.';
  }
  const title = form.title.trim();
  if (!title) errors.title = 'Enter a title for the event.';
  else if (title.length > 100) errors.title = 'The title can have at most 100 characters.';
  const description = form.description.trim();
  if (!description) errors.description = 'Enter a description of the event.';
  else if (description.length > 2000) errors.description = 'The description can have at most 2000 characters.';
  return errors;
}

// Step 2 of 2: date, times, venue, capacity and the extra fields for the type.
export function validateDetails(form) {
  const errors = {};
  if (!form.date) errors.date = 'Choose the date of the event.';
  if (!form.startTime) errors.startTime = 'Choose a start time.';
  if (!form.endTime) errors.endTime = 'Choose an end time.';

  if (form.date && form.startTime && form.endTime) {
    const start = Date.parse(toUtcIso(form.date, form.startTime));
    const end = Date.parse(toUtcIso(form.date, form.endTime));
    if (end <= start) errors.endTime = 'The end time must be after the start time.';
    if (start <= Date.now()) errors.startTime = 'The start time must be in the future.';
  }

  if (!form.venueChoice) errors.venueChoice = 'Choose a venue, or choose Online.';

  const capacityText = String(form.capacity ?? '').trim();
  if (!capacityText) errors.capacity = 'Enter the capacity.';
  else if (!/^\d+$/.test(capacityText) || Number(capacityText) < 1) {
    errors.capacity = 'Capacity must be a whole number of at least 1.';
  } else if (form.venueChoice && form.venueChoice !== ONLINE && form.venueCapacity != null && Number(capacityText) > form.venueCapacity) {
    errors.capacity = `This venue holds at most ${form.venueCapacity} people. Enter ${form.venueCapacity} or fewer.`;
  }

  const extra = extraFieldsFor(form.eventType);
  if (extra === 'speaker') {
    if (blank(form.speakerName)) errors.speakerName = 'Enter the speaker name.';
    if (blank(form.speakerDesignation)) errors.speakerDesignation = 'Enter the speaker designation.';
  }
  if (extra === 'thesis') {
    if (blank(form.presenterName)) errors.presenterName = 'Enter the presenter name.';
    if (blank(form.thesisTitle)) errors.thesisTitle = 'Enter the thesis title.';
    if (blank(form.supervisorName)) errors.supervisorName = 'Enter the supervisor name.';
  }
  return errors;
}

// The body for POST /events and PUT /events/:id (Master Document 6.4).
export function buildPayload(form) {
  const payload = {
    organisationId: form.organisationId,
    title: form.title.trim(),
    description: form.description.trim(),
    eventType: form.eventType,
    startAt: toUtcIso(form.date, form.startTime),
    endAt: toUtcIso(form.date, form.endTime),
    capacity: Number(form.capacity),
    registrationRequired: !!form.registrationRequired,
    attendanceEnabled: !!form.attendanceEnabled,
  };
  if (form.venueChoice === ONLINE) payload.isOnline = true;
  else payload.venueId = form.venueChoice;

  const extra = extraFieldsFor(form.eventType);
  if (extra === 'speaker') {
    payload.speakerName = form.speakerName.trim();
    payload.speakerDesignation = form.speakerDesignation.trim();
  }
  if (extra === 'thesis') {
    payload.presenterName = form.presenterName.trim();
    payload.thesisTitle = form.thesisTitle.trim();
    payload.supervisorName = form.supervisorName.trim();
  }
  return payload;
}

// Fill the form from an existing event (Edit after Changes Requested, screen 14).
export function formFromEvent(event) {
  return {
    ...EMPTY_FORM,
    organisationId: event.organisationId,
    organisationName: event.organisationName,
    category: event.category,
    eventType: event.eventType,
    title: event.title,
    description: event.description || '',
    date: toDateString(event.startAt),
    startTime: toTimeString(event.startAt),
    endTime: toTimeString(event.endAt),
    venueChoice: event.isOnline ? ONLINE : event.venue?.id || '',
    venueName: event.isOnline ? 'Online' : event.venue?.name || '',
    venueCapacity: event.isOnline ? null : event.venue?.capacity ?? null,
    capacity: event.capacity != null ? String(event.capacity) : '',
    registrationRequired: !!event.registrationRequired,
    attendanceEnabled: !!event.attendanceEnabled,
    speakerName: event.speakerName || '',
    speakerDesignation: event.speakerDesignation || '',
    presenterName: event.presenterName || '',
    thesisTitle: event.thesisTitle || '',
    supervisorName: event.supervisorName || '',
  };
}

// Server field names (from the payload) to the form's field names.
const SERVER_TO_FORM = { startAt: 'startTime', endAt: 'endTime', venueId: 'venueChoice', isOnline: 'venueChoice' };
export const mapServerFields = (fields = {}) => {
  const mapped = {};
  Object.keys(fields).forEach((key) => {
    mapped[SERVER_TO_FORM[key] || key] = fields[key];
  });
  return mapped;
};

export const FIELD_LABELS = {
  organisationId: 'Organisation',
  eventType: 'Event type',
  title: 'Title',
  description: 'Description',
  date: 'Date',
  startTime: 'Start time',
  endTime: 'End time',
  venueChoice: 'Venue',
  capacity: 'Capacity',
  speakerName: 'Speaker name',
  speakerDesignation: 'Speaker designation',
  presenterName: 'Presenter name',
  thesisTitle: 'Thesis title',
  supervisorName: 'Supervisor name',
};

// Fields that live on step 1, so errors can send the user to the right step.
export const STEP1_FIELDS = ['organisationId', 'eventType', 'title', 'description'];
