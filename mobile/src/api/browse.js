import { mockEnabled } from '../config';
import client from './client';
import * as mock from './mock/mockBrowse';

// Browse endpoints from Master Document 6.3. Only these calls, nothing else.
// While mocks are on (config.js) the same functions answer from src/api/mock/mockBrowse.js.

const useMock = () => mockEnabled('browse');

// The contract says these return plain lists. If the server wraps a list in an object,
// accept that too, so a small difference does not break the screen.
const asList = (data, key) => (Array.isArray(data) ? data : (data && data[key]) || []);

// GET /categories -> [{ key, label, organisationCount }]
export async function getCategories() {
  if (useMock()) return mock.getCategories();
  const { data } = await client.get('/categories');
  return asList(data, 'categories');
}

// GET /organisations?category=society -> [{ id, name, category, upcomingCount }]
export async function getOrganisations({ category }) {
  if (useMock()) return mock.getOrganisations({ category });
  const { data } = await client.get('/organisations', { params: { category } });
  return asList(data, 'organisations');
}

// GET /organisations/:id -> { id, name, category, description }
export async function getOrganisation(id) {
  if (useMock()) return mock.getOrganisation(id);
  const { data } = await client.get(`/organisations/${id}`);
  return data.organisation || data;
}

// GET /organisations/:id/events?when=upcoming|past -> events the caller may see
export async function getOrganisationEvents(id, { when = 'upcoming' } = {}) {
  if (useMock()) return mock.getOrganisationEvents(id, { when });
  const { data } = await client.get(`/organisations/${id}/events`, { params: { when } });
  return asList(data, 'events');
}
