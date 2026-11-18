const mongoose = require('mongoose');
const Setting = require('../models/Setting');
const Venue = require('../models/Venue');

const TZ = 'Asia/Karachi'; // UTC+5, SRS NFR-LOC-01
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SPEAKER_TYPES = ['Guest Speaker Session', 'Faculty Talk', 'Faculty Research Presentation', 'Book Launch'];
const THESIS_TYPES = ['Thesis Defence', 'PhD Presentation'];

// "2026-11-24" for the Pakistan calendar day of a date
function pktDay(date) {
  return date.toLocaleDateString('en-CA', { timeZone: TZ });
}

// "24 Nov 2026"
function formatDate(date) {
  const [y, m, d] = pktDay(date).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// "5:00 PM"
function formatTime(date) {
  return date
    .toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s/g, ' ');
}

function parseDate(value) {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const text = (v) => (typeof v === 'string' ? v.trim() : '');

// Checks the event form (Section 5.9). Returns the clean data to save and a
// field-by-field map of messages. Empty `fields` means the form is valid.
async function validateEventInput(body, organisation) {
  const fields = {};
  const data = {};

  const title = text(body.title);
  if (!title) fields.title = 'Enter a title.';
  else if (title.length > 100) fields.title = 'The title can be at most 100 characters.';
  data.title = title;

  const description = text(body.description);
  if (!description) fields.description = 'Enter a description.';
  else if (description.length > 2000) fields.description = 'The description can be at most 2000 characters.';
  data.description = description;

  // Event type must be allowed for the organisation's category
  const eventType = text(body.eventType);
  const setting = await Setting.findOne();
  const allowedTypes =
    (setting && setting.eventTypes && setting.eventTypes[organisation.category]) || [];
  if (!eventType) fields.eventType = 'Choose an event type.';
  else if (!allowedTypes.includes(eventType)) {
    fields.eventType = 'This event type is not available for this organisation.';
  }
  data.eventType = eventType;

  // Extra fields (FR-SUB-04). Fields that do not apply are cleared.
  const extras = { speakerName: '', speakerDesignation: '', presenterName: '', thesisTitle: '', supervisorName: '' };
  const required = [];
  if (SPEAKER_TYPES.includes(eventType)) {
    required.push(['speakerName', 'Enter the speaker name.'], ['speakerDesignation', 'Enter the speaker designation.']);
  }
  if (THESIS_TYPES.includes(eventType)) {
    required.push(
      ['presenterName', 'Enter the presenter name.'],
      ['thesisTitle', 'Enter the thesis title.'],
      ['supervisorName', 'Enter the supervisor name.']
    );
  }
  for (const [key, message] of required) {
    const value = text(body[key]);
    if (!value) fields[key] = message;
    else if (value.length > 150) fields[key] = 'This can be at most 150 characters.';
    extras[key] = value;
  }
  Object.assign(data, extras);

  // Dates: end after start, start in the future, same day in Pakistan time
  const startAt = parseDate(body.startAt);
  const endAt = parseDate(body.endAt);
  if (!startAt) fields.startAt = 'Choose a start date and time.';
  if (!endAt) fields.endAt = 'Choose an end date and time.';
  if (startAt && endAt) {
    if (endAt <= startAt) fields.endAt = 'End time must be after the start time.';
    else if (pktDay(startAt) !== pktDay(endAt)) fields.endAt = 'The event must start and end on the same day.';
  }
  if (startAt && startAt <= new Date()) fields.startAt = 'Start time must be in the future.';
  data.startAt = startAt;
  data.endAt = endAt;

  // Venue or online
  const isOnline = body.isOnline === true;
  data.isOnline = isOnline;
  let venue = null;
  data.venueId = null;
  if (!isOnline) {
    if (typeof body.venueId !== 'string' || !mongoose.isValidObjectId(body.venueId)) {
      fields.venueId = 'Choose a venue, or mark the event as online.';
    } else {
      venue = await Venue.findById(body.venueId);
      if (!venue || !venue.isActive) {
        fields.venueId = 'This venue is not available. Choose another venue.';
        venue = null;
      } else {
        data.venueId = venue._id;
      }
    }
  }

  // Capacity: whole number, at least 1, not above the venue's capacity
  const raw = body.capacity;
  const number =
    typeof raw === 'number' ? raw : typeof raw === 'string' && /^\d+$/.test(raw.trim()) ? Number(raw) : NaN;
  if (raw === undefined || raw === null || raw === '') fields.capacity = 'Enter the expected capacity.';
  else if (!Number.isInteger(number) || number < 1) fields.capacity = 'Capacity must be a whole number of at least 1.';
  else if (venue && number > venue.capacity) {
    fields.capacity = `Capacity cannot be more than the venue's capacity (${venue.capacity}).`;
  } else data.capacity = number;

  // Yes / no fields
  if (typeof body.registrationRequired !== 'boolean') fields.registrationRequired = 'Choose yes or no.';
  else data.registrationRequired = body.registrationRequired;

  if (body.attendanceEnabled === undefined || body.attendanceEnabled === null) data.attendanceEnabled = false;
  else if (typeof body.attendanceEnabled !== 'boolean') fields.attendanceEnabled = 'Choose yes or no.';
  else data.attendanceEnabled = body.attendanceEnabled;

  return { fields, data, venue };
}

module.exports = { validateEventInput, pktDay, formatDate, formatTime };