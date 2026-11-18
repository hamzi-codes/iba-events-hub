import { ApiError } from '../ApiError';
import { toDateString } from '../../utils/dates';
import { getCurrentUser } from './mockAuth';
import { canSeeHistory, events, toEventObject } from './mockData';
import { delay } from './mockUtils';

// Mock versions of the approval endpoints (Master Document 6.5), copying the rules in
// Section 5.7: only PENDING events can be decided, the first decision wins, an approver
// cannot decide their own event (D4), and Approve is refused once the event has started.

const DECISIONS = ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'];

const forbidden = (message) => new ApiError({ status: 403, code: 'FORBIDDEN', message });
const notFound = () => new ApiError({ status: 404, code: 'NOT_FOUND', message: 'We could not find that event. Go back and try again.' });

async function requireApprover() {
  const user = await getCurrentUser();
  if (!user.roles.includes('approver')) throw forbidden('You do not have permission to do that.');
  return user;
}

const approvesFor = (user, organisationId) =>
  user.affiliations.some((a) => a.organisationId === organisationId && a.type === 'approver');

// When the event was last sent for approval (a resubmission counts), for "oldest first".
const submittedAt = (ev) => {
  const entries = ev.history.filter((h) => h.toStatus === 'PENDING');
  return entries.length ? entries[entries.length - 1].createdAt : ev.createdAt;
};

// The latest decision an approver made on the event, or null.
const lastDecision = (ev) => {
  const entries = ev.history.filter((h) => h.actorRole === 'approver' && DECISIONS.includes(h.toStatus));
  return entries.length ? entries[entries.length - 1] : null;
};

// GET /approvals/pending -> { total, events } oldest first, own organisations only
export async function getPending() {
  await delay();
  const user = await requireApprover();
  const list = events
    .filter((ev) => ev.status === 'PENDING' && approvesFor(user, ev.organisationId))
    .sort((a, b) => new Date(submittedAt(a)) - new Date(submittedAt(b)));
  return { total: list.length, events: list.map((ev) => ({ ...toEventObject(ev), submittedAt: submittedAt(ev) })) };
}

// GET /approvals/decided?decision=&from=&to= -> events with the decision made on them
// Each item is an event object plus decision (APPROVED, REJECTED or CHANGES_REQUESTED),
// decidedAt and decisionComment. "from" and "to" are days (YYYY-MM-DD), both included.
export async function getDecided({ decision, from, to } = {}) {
  await delay();
  const user = await requireApprover();
  const items = [];
  events.forEach((ev) => {
    if (!approvesFor(user, ev.organisationId)) return;
    const last = lastDecision(ev);
    if (!last) return;
    const day = toDateString(last.createdAt);
    if (decision && last.toStatus !== decision) return;
    if (from && day < from) return;
    if (to && day > to) return;
    items.push({ ...toEventObject(ev), decision: last.toStatus, decidedAt: last.createdAt, decisionComment: last.comment || '' });
  });
  return items.sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt));
}

function loadForDecision(user, id) {
  const ev = events.find((item) => item.id === id);
  if (!ev || !canSeeHistory(user, ev)) throw notFound();
  if (!approvesFor(user, ev.organisationId)) throw forbidden('Only the approving authority for this organisation can decide.');
  if (ev.createdBy === user.id) throw forbidden('You cannot decide on your own event. Another approver must do it.');
  if (ev.status !== 'PENDING') {
    throw new ApiError({ status: 409, code: 'ALREADY_DECIDED', message: 'This event has already been decided by someone else. Go back to the queue.' });
  }
  return ev;
}

function decide(ev, user, toStatus, comment) {
  ev.status = toStatus;
  ev.history.push({
    fromStatus: 'PENDING',
    toStatus,
    actor: { id: user.id, fullName: user.fullName },
    actorRole: 'approver',
    comment,
    createdAt: new Date().toISOString(),
  });
  return toEventObject(ev, { withHistory: true });
}

const commentError = () =>
  new ApiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Some details need fixing. Check the comment and try again.',
    fields: { comment: 'Enter a comment of at least 10 characters.' },
  });

// POST /approvals/:eventId/approve (comment optional)
export async function approve(id, { comment } = {}) {
  await delay(400);
  const user = await requireApprover();
  const ev = loadForDecision(user, id);
  if (Date.parse(ev.startAt) <= Date.now()) {
    throw new ApiError({ status: 400, code: 'EVENT_ALREADY_STARTED', message: 'This event has already started, so it cannot be approved now. You can ask for changes or reject it.' });
  }
  return decide(ev, user, 'APPROVED', String(comment || '').trim());
}

// POST /approvals/:eventId/reject (comment at least 10 characters). Final.
export async function reject(id, { comment } = {}) {
  await delay(400);
  const user = await requireApprover();
  const ev = loadForDecision(user, id);
  const text = String(comment || '').trim();
  if (text.length < 10) throw commentError();
  return decide(ev, user, 'REJECTED', text);
}

// POST /approvals/:eventId/request-changes (comment at least 10 characters)
export async function requestChanges(id, { comment } = {}) {
  await delay(400);
  const user = await requireApprover();
  const ev = loadForDecision(user, id);
  const text = String(comment || '').trim();
  if (text.length < 10) throw commentError();
  return decide(ev, user, 'CHANGES_REQUESTED', text);
}
