import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as authApi from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { clearToken, getToken, setToken } from '../api/tokenStorage';

// Holds the logged-in user and token (Master Document 7.5).
//  - on app start: reads the token from SecureStore and calls /auth/me
//  - login(): calls the API, stores the token in SecureStore, sets the user
//  - logout(): tells the API, deletes the token (NFR-SEC-05), clears the user
// "booting" is true until the first check finishes, so the app can show a loading view
// instead of flashing the Login screen.

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [booting, setBooting] = useState(true);

  const endSession = useCallback(() => {
    setUser(null);
    setTokenState(null);
  }, []);

  // The API client calls this on a 401 (expired or tampered token): back to Login.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await getToken();
        if (stored) {
          const me = await authApi.getMe();
          if (active) {
            setTokenState(stored);
            setUser(me);
          }
        }
      } catch (error) {
        // On a 401 the token is no good. On a network error we keep it and show Login;
        // logging in again replaces it.
        if (error?.status === 401) await clearToken();
      } finally {
        if (active) setBooting(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const result = await authApi.login({ email, password });
    await setToken(result.token);
    setTokenState(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // needs the token, so call it before deleting the token
    } catch {
      // Even if the server cannot be reached, the user must still be logged out here.
    }
    await clearToken();
    endSession();
  }, [endSession]);

  // Role changes take effect on the user's next request (Section 6.6), so screens can
  // call this to pick up new roles without logging out.
  const refreshUser = useCallback(async () => {
    const me = await authApi.getMe();
    setUser(me);
    return me;
  }, []);

  const hasRole = useCallback((role) => !!user && user.roles.includes(role), [user]);

  const value = useMemo(
    () => ({ user, token, booting, login, logout, refreshUser, hasRole }),
    [user, token, booting, login, logout, refreshUser, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>.');
  return context;
}
