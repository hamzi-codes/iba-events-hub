import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// All date and time decisions live here so the app and the API agree
// (Master Document 5.12). Times are stored and sent as UTC ISO strings and
// shown in Pakistan time, 12-hour clock, e.g. "24 Nov 2026, 5:00 PM".

dayjs.extend(utc);
dayjs.extend(timezone);

export const TIME_ZONE = 'Asia/Karachi';

const inPakistan = (value) => dayjs(value).tz(TIME_ZONE);

export const formatDateTime = (value) => inPakistan(value).format('D MMM YYYY, h:mm A');
export const formatDate = (value) => inPakistan(value).format('D MMM YYYY');
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
  dayjs.tz(`${dateString} ${timeString}`, TIME_ZONE).toDate().toISOString();
