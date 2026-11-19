import { mockEnabled } from '../config';
import client from './client';
import * as mock from './mock/mockApprovals';

// Approving authority endpoints (Master Document 6.5).
const useMock = () => mockEnabled('approvals');
const asList = (data, key) => (Array.isArray(data) ? data : (data && data[key]) || []);

// GET /approvals/pending -> { total, events } oldest first, only the caller's organisations
export async function getPending() {
  if (useMock()) return mock.getPending();
  const { data } = await client.get('/approvals/pending');
  const events = asList(data, 'events');
  return { total: typeof data?.total === 'number' ? data.total : events.length, events };
}

// GET /approvals/decided?decision=&from=&to=  (from and to are days like 2026-11-24)
// Each item is an event with the decision made on it. The app reads `decision` (APPROVED,
// REJECTED or CHANGES_REQUESTED), `decidedAt` and `decisionComment`, and falls back to
// the event's history or status if the API leaves them out.
export async function getDecided({ decision, from, to } = {}) {
  if (useMock()) return mock.getDecided({ decision, from, to });
  const params = {};
  if (decision) params.decision = decision;
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await client.get('/approvals/decided', { params });
  return asList(data, 'events');
}

// POST /approvals/:eventId/approve   comment optional
export async function approve(eventId, { comment } = {}) {
  if (useMock()) return mock.approve(eventId, { comment });
  const { data } = await client.post(`/approvals/${eventId}/approve`, comment ? { comment } : {});
  return data.event || data;
}

// POST /approvals/:eventId/reject   comment at least 10 characters
export async function reject(eventId, { comment }) {
  if (useMock()) return mock.reject(eventId, { comment });
  const { data } = await client.post(`/approvals/${eventId}/reject`, { comment });
  return data.event || data;
}

// POST /approvals/:eventId/request-changes   comment at least 10 characters
export async function requestChanges(eventId, { comment }) {
  if (useMock()) return mock.requestChanges(eventId, { comment });
  const { data } = await client.post(`/approvals/${eventId}/request-changes`, { comment });
  return data.event || data;
}
