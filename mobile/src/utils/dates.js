import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// All date and time decisions live here so the app and the API agree
// (Master Document 5.12). Times are stored and sent as UTC ISO strings and
// shown in Pakistan time, 12-hour clock, e.g. "24 Nov 2026, 5:00 PM".
//
// Pakistan is a fixed UTC+5 (no daylight saving), so we use the dayjs utc plugin with a
// fixed offset instead of the dayjs timezone plugin. The timezone plugin reads dates back
// from locale text, which the Hermes engine on phones cannot parse, and it crashed the app
// on start ("RangeError: Date value out of bounds"). Logged in docs/deviations.md.

dayjs.extend(utc);

export const TIME_ZONE = 'Asia/Karachi'; // for reference only
export const PAKISTAN_OFFSET_MINUTES = 300; // UTC+5

const inPakistan = (value) => dayjs(value).utcOffset(PAKISTAN_OFFSET_MINUTES);

// "now" in Pakistan time, for code that needs to build dates (mock data, date pickers).
export const nowInPakistan = () => dayjs().utcOffset(PAKISTAN_OFFSET_MINUTES);

export const formatDateTime = (value) => inPakistan(value).format('D MMM YYYY, h:mm A');
export const formatDate = (value) => inPakistan(value).format('D MMM YYYY');
// "Tue, 24 Nov 2026"
export const formatDay = (value) => inPakistan(value).format('ddd, D MMM YYYY');
export const formatTime = (value) => inPakistan(value).format('h:mm A');

// "24 Nov 2026, 5:00 PM to 7:00 PM" (one event never crosses midnight, FR-SUB-05)
export const formatDateRange = (startAt, endAt) =>
  `${formatDateTime(startAt)} to ${formatTime(endAt)}`;

export const isSamePakistanDay = (a, b) => inPakistan(a).isSame(inPakistan(b), 'day');

// "Upcoming" means the end time is still in the future (includes events in progress).
export const isUpcoming = (endAt) => dayjs(endAt).isAfter(dayjs());
export const isPast = (endAt) => !isUpcoming(endAt);

// Build a UTC ISO string from a date ("2026-11-24") and time ("17:00") picked in Pakistan time.
export const toUtcIso = (dateString, timeString) =>
  dayjs.utc(`${dateString} ${timeString}`).subtract(PAKISTAN_OFFSET_MINUTES, 'minute').toISOString();
