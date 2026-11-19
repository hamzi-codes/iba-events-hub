import { mockEnabled } from '../config';
import client from './client';
import * as mock from './mock/mockAuth';

// Auth endpoints from Master Document 6.2. Only these calls, nothing else.
// While mocks are on (config.js) the same functions answer from src/api/mock/mockAuth.js.

const useMock = () => mockEnabled('auth');

// POST /auth/signup -> 201 { message }
export async function signup({ fullName, email, password, confirmPassword }) {
  if (useMock()) return mock.signup({ fullName, email, password, confirmPassword });
  const { data } = await client.post('/auth/signup', { fullName, email, password, confirmPassword });
  return data;
}

// POST /auth/verify-email
export async function verifyEmail({ email, code }) {
  if (useMock()) return mock.verifyEmail({ email, code });
  const { data } = await client.post('/auth/verify-email', { email, code });
  return data;
}

// POST /auth/resend-code
export async function resendCode({ email }) {
  if (useMock()) return mock.resendCode({ email });
  const { data } = await client.post('/auth/resend-code', { email });
  return data;
}

// POST /auth/login -> { token, user }
export async function login({ email, password }) {
  if (useMock()) return mock.login({ email, password });
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}

// GET /auth/me -> { user }. Returns the user object.
export async function getMe() {
  if (useMock()) return mock.getMe();
  const { data } = await client.get('/auth/me');
  return data.user;
}

// POST /auth/logout -> 204
export async function logout() {
  if (useMock()) return mock.logout();
  await client.post('/auth/logout');
  return null;
}
