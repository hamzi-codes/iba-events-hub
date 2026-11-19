import axios from 'axios';

import { API_URL } from '../config';
import { toApiError } from './ApiError';
import { clearToken, getToken } from './tokenStorage';

// One axios instance for the whole app (Master Document 7.5).
//  - base URL from EXPO_PUBLIC_API_URL
//  - 10 second timeout (NFR-REL-03)
//  - request step adds the token from SecureStore
//  - response step turns every failure into an ApiError, and on a 401 clears the
//    token and tells AuthContext, which sends the user back to Login

let onUnauthorized = null;

// AuthContext registers itself here so the client can end the session on a 401.
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = toApiError(error);
    // A wrong password on the login screen is also a 401, but it is not a lost session.
    // The server answers 403 ACCOUNT_DEACTIVATED on any call once an admin deactivates the
    // user, so that also ends the session (but not on the login call itself).
    const lostSession =
      (apiError.status === 401 && apiError.code !== 'INVALID_CREDENTIALS') ||
      (apiError.code === 'ACCOUNT_DEACTIVATED' && !String(error?.config?.url || '').includes('/auth/login'));
    if (lostSession) {
      await clearToken();
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(apiError);
  }
);

export default client;
