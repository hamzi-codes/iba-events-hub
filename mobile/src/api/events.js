import { mockEnabled } from '../config';
import client from './client';
import * as mock from './mock/mockBrowse';
import * as mock2 from './mock/mockEvents';

// Event endpoints from Master Document 6.3 and 6.4. More are added as the organiser
// screens are built (conflict check, create, edit, cancel).

const useMock = () => mockEnabled('events');

// GET /events/:id -> Event object. Includes history only when the caller may see it.
// An event the caller may not see is a 404 (BR-01).
export async function getEvent(id) {
  if (useMock()) return mock.getEvent(id);
  const { data } = await client.get(`/events/${id}`);
  return data.event || data;
}

// ---- Organiser endpoints (Master Document 6.4) ----
const asList = (data, key) => (Array.isArray(data) ? data : (data && data[key]) || []);

// GET /events/conflict-check -> { conflict: false } or { conflict: true, clashingEvent }
export async function getConflict({ venueId, startAt, endAt, excludeEventId }) {
  if (useMock()) return mock2.getConflict({ venueId, startAt, endAt, excludeEventId });
  const params = { venueId, startAt, endAt };
  if (excludeEventId) params.excludeEventId = excludeEventId;
  const { data } = await client.get('/events/conflict-check', { params });
  return data;
}

// POST /events -> 201 event (status PENDING). 409 VENUE_CONFLICT, 400 VALIDATION_ERROR with fields.
export async function createEvent(payload) {
  if (useMock()) return mock2.createEvent(payload);
  const { data } = await client.post('/events', payload);
  return data.event || data;
}

// GET /my/events -> events of the caller's organiser organisations, all statuses
export async function getMyEvents() {
  if (useMock()) return mock2.getMyEvents();
  const { data } = await client.get('/my/events');
  return asList(data, 'events');
}

// PUT /events/:id (only while Changes Requested)
export async function updateEvent(id, payload) {
  if (useMock()) return mock2.updateEvent(id, payload);
  const { data } = await client.put(`/events/${id}`, payload);
  return data.event || data;
}

// POST /events/:id/resubmit
export async function resubmitEvent(id) {
  if (useMock()) return mock2.resubmitEvent(id);
  const { data } = await client.post(`/events/${id}/resubmit`);
  return data.event || data;
}

// POST /events/:id/cancel  (reason required, at least 10 characters, for an Approved event)
export async function cancelEvent(id, { reason } = {}) {
  if (useMock()) return mock2.cancelEvent(id, { reason });
  const { data } = await client.post(`/events/${id}/cancel`, reason ? { reason } : {});
  return data.event || data;
}
