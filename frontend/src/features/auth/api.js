import axios from 'axios';
import { env } from '@/config/env.js';
import { apiClient } from '@/services/apiClient.js';

// Bare axios for the refresh call so it doesn't recurse through our interceptor.
const bareClient = axios.create({ baseURL: env.apiBaseUrl, timeout: 15000 });

export const authApi = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data),
  // Step 2 of two-step login (only when /auth/login returned needs_totp=true).
  loginTotp: (pending_token, code) =>
    apiClient
      .post('/auth/login/totp', { pending_token, code })
      .then((r) => r.data),
  register: (payload) =>
    apiClient.post('/auth/register', payload).then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  // Self-service profile update. Body is partial — only changed fields.
  updateMe: (payload) => apiClient.patch('/auth/me', payload).then((r) => r.data),

  // Capability flags (e.g. whether Google login is configured).
  getConfig: () => apiClient.get('/auth/config').then((r) => r.data),

  // Password reset via emailed OTP.
  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (email, otp, new_password) =>
    apiClient
      .post('/auth/reset-password', { email, otp, new_password })
      .then((r) => r.data),

  // Refresh uses the bare client because the response interceptor would
  // otherwise try to refresh on its own 401 — infinite loop city.
  refresh: (refresh_token) =>
    bareClient
      .post('/auth/refresh', { refresh_token })
      .then((r) => r.data),

  // Logout: server best-effort revokes the session; we always clear local
  // state regardless of the response (offline still logs out the device).
  logout: (refresh_token) =>
    apiClient.post('/auth/logout', { refresh_token }).then(() => {}),

  // Force-logout every session for the current user across all devices.
  revokeAllSessions: () =>
    apiClient.post('/auth/sessions/revoke-all').then((r) => r.data),
};
