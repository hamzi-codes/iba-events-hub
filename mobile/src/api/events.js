import { mockEnabled } from '../config';
import client from './client';
import * as mock from './mock/mockBrowse';

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
