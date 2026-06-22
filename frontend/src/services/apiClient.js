import axios from 'axios';
import { env } from '@/config/env.js';
import { useAuthStore } from '@/features/auth/store.js';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- Refresh single-flight ----
//
// When the access token expires, *many* in-flight requests can hit 401 at the
// same time (e.g. the homepage fans out 5 API calls). Without coordination we
// would burn 5 refresh tokens — and 4 of them would later "reuse-detect" each
// other and kill the session.
//
// `refreshPromise` holds the currently-running refresh call (if any). Every
// 401 awaits the same promise, so we issue exactly ONE refresh per token cycle
// and replay the queued requests with the new token.
let refreshPromise = null;

async function refreshAccessToken() {
  const store = useAuthStore.getState();
  const rt = store.refreshToken;
  if (!rt) throw new Error('no refresh token');

  // Import lazily — avoids a circular import (authApi → apiClient).
  const { authApi } = await import('@/features/auth/api.js');
  const tokens = await authApi.refresh(rt);
  useAuthStore.getState().setTokens({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });
  return tokens.access_token;
}

apiClient.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const path = original?.url || '';

    // Don't try to refresh on the auth endpoints themselves — that path leads
    // to recursion. The login + refresh routes report their own failures
    // directly to the caller.
    const isAuthRoute =
      path.includes('/auth/login') ||
      path.includes('/auth/refresh') ||
      path.includes('/auth/register');

    if (
      status === 401 &&
      !isAuthRoute &&
      !original?._retried &&
      useAuthStore.getState().refreshToken
    ) {
      original._retried = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccess = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch (_err) {
        // Refresh failed — the session is gone for good. Clear local state
        // so the next render bounces them to /login.
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    if (status === 401) {
      // No refresh available (or it's an auth route's own failure): treat as
      // signed-out. Mirrors the original behaviour pre-rotation.
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
