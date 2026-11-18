import { ApiError } from '../ApiError';
import { getCurrentUser } from './mockAuth';
import {
  APPROVER_NAMES,
  CATEGORIES,
  ORG_LIST,
  canSeeEvent,
  canSeeHistory,
  events,
  findOrg,
  toEventObject,
  upcomingCountFor,
} from './mockData';
import { delay } from './mockUtils';
import { isUpcoming } from '../../utils/dates';

// Mock versions of the browse endpoints in Master Document 6.3.

const notFound = (what) =>
  new ApiError({
    status: 404,
    code: 'NOT_FOUND',
    message: `We could not find that ${what}. It may not be available. Go back and try again.`,
  });

// GET /categories
export async function getCategories() {
  await delay();
  await getCurrentUser();
  return CATEGORIES.map(({ key, label }) => ({
    key,
    label,
    organisationCount: ORG_LIST.filter((o) => o.category === key && o.isActive).length,
  }));
}

// GET /organisations?category=society  (active only, A to Z)
export async function getOrganisations({ category }) {
  await delay();
  await getCurrentUser();
  return ORG_LIST.filter((o) => o.isActive && (!category || o.category === category))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((o) => ({ id: o.id, name: o.name, category: o.category, upcomingCount: upcomingCountFor(o.id) }));
}

// GET /organisations/:id
export async function getOrganisation(id) {
  await delay();
  await getCurrentUser();
  const organisation = findOrg(id);
  if (!organisation) throw notFound('organisation');
  const result = { id: organisation.id, name: organisation.name, category: organisation.category, description: organisation.description };
  // Organisers, approvers and admins also get the approver names (Section 7.3, screen 12).
  const user = await getCurrentUser();
  if (user.roles.some((role) => ['organiser', 'approver', 'admin'].includes(role))) {
    result.approvers = (APPROVER_NAMES[organisation.id] || []).map((fullName) => ({ fullName }));
  }
  return result;
}

// GET /organisations/:id/events?when=upcoming|past
// Upcoming means the end time is still in the future. Upcoming: soonest first. Past: latest first.
export async function getOrganisationEvents(id, { when = 'upcoming' } = {}) {
  await delay();
  const user = await getCurrentUser();
  if (!findOrg(id)) throw notFound('organisation');
  const wantUpcoming = when !== 'past';
  return events
    .filter((ev) => ev.organisationId === id && canSeeEvent(user, ev) && isUpcoming(ev.endAt) === wantUpcoming)
    .sort((a, b) => (wantUpcoming ? new Date(a.startAt) - new Date(b.startAt) : new Date(b.startAt) - new Date(a.startAt)))
    .map((ev) => toEventObject(ev));
}

// GET /events/:id  (anything the caller may not see is a 404, BR-01)
export async function getEvent(id) {
  await delay();
  const user = await getCurrentUser();
  const ev = events.find((item) => item.id === id);
  if (!ev || !canSeeEvent(user, ev)) throw notFound('event');
  return toEventObject(ev, { withHistory: canSeeHistory(user, ev) });
}
