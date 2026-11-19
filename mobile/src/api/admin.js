import { mockEnabled } from '../config';
import client from './client';
import * as mock from './mock/mockAdmin';

// Admin endpoints (Master Document 6.6). Role admin only, otherwise 403.
// The response shapes are not written down in the Master Document. The app expects:
//   user         { id, fullName, email, roles, isActive, affiliations: [{ organisationId, organisationName, category, type }] }
//   organisation { id, name, category, description, isActive, approvers: [{ id, fullName, email }],
//                  organisers: [{ id, fullName, email }], pendingEventsCount }
//   venue        { id, name, location, capacity, isActive }
// A list can be a plain array or wrapped ({ users }, { organisations }, { venues }, { events }).
const useMock = () => mockEnabled('admin');
const asList = (data, key) => (Array.isArray(data) ? data : (data && data[key]) || []);
const one = (data, key) => (data && data[key]) || data;

// ----- users
export async function getUsers({ search, role, status } = {}) {
  if (useMock()) return mock.getUsers({ search, role, status });
  const params = {};
  if (search) params.search = search;
  if (role) params.role = role;
  if (status) params.status = status;
  const { data } = await client.get('/admin/users', { params });
  return asList(data, 'users');
}
export async function getUser(id) {
  if (useMock()) return mock.getUser(id);
  const { data } = await client.get(`/admin/users/${id}`);
  return one(data, 'user');
}
// Roles and links go together in one request (Section 6.6).
export async function updateAccess(id, { roles, affiliations }) {
  if (useMock()) return mock.updateAccess(id, { roles, affiliations });
  const { data } = await client.put(`/admin/users/${id}/access`, { roles, affiliations });
  return one(data, 'user');
}
export async function setUserStatus(id, isActive) {
  if (useMock()) return mock.setUserStatus(id, { isActive });
  const { data } = await client.patch(`/admin/users/${id}/status`, { isActive });
  return one(data, 'user');
}

// ----- organisations
export async function getOrganisations({ category, includeInactive } = {}) {
  if (useMock()) return mock.getOrganisations({ category, includeInactive });
  const params = {};
  if (category) params.category = category;
  if (includeInactive) params.includeInactive = true;
  const { data } = await client.get('/admin/organisations', { params });
  return asList(data, 'organisations');
}
export async function createOrganisation(payload) {
  if (useMock()) return mock.createOrganisation(payload);
  const { data } = await client.post('/admin/organisations', payload);
  return one(data, 'organisation');
}
export async function updateOrganisation(id, payload) {
  if (useMock()) return mock.updateOrganisation(id, payload);
  const { data } = await client.put(`/admin/organisations/${id}`, payload);
  return one(data, 'organisation');
}
// 409 HAS_PENDING_EVENTS when deactivating while events are pending
export async function setOrganisationStatus(id, isActive) {
  if (useMock()) return mock.setOrganisationStatus(id, { isActive });
  const { data } = await client.patch(`/admin/organisations/${id}/status`, { isActive });
  return one(data, 'organisation');
}

// ----- venues
export async function getVenues() {
  if (useMock()) return mock.getVenues();
  const { data } = await client.get('/admin/venues');
  return asList(data, 'venues');
}
export async function createVenue(payload) {
  if (useMock()) return mock.createVenue(payload);
  const { data } = await client.post('/admin/venues', payload);
  return one(data, 'venue');
}
export async function updateVenue(id, payload) {
  if (useMock()) return mock.updateVenue(id, payload);
  const { data } = await client.put(`/admin/venues/${id}`, payload);
  return one(data, 'venue');
}
export async function setVenueStatus(id, isActive) {
  if (useMock()) return mock.setVenueStatus(id, { isActive });
  const { data } = await client.patch(`/admin/venues/${id}/status`, { isActive });
  return one(data, 'venue');
}

// ----- events (read only)
export async function getEvents({ status } = {}) {
  if (useMock()) return mock.getEvents({ status });
  const { data } = await client.get('/admin/events', { params: status ? { status } : {} });
  return asList(data, 'events');
}
