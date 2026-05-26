import { apiClient } from '@/services/apiClient.js';

export const authApi = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }).then((r) => r.data),
  register: (payload) =>
    apiClient.post('/auth/register', payload).then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),

  // Capability flags (e.g. whether Google login is configured).
  getConfig: () => apiClient.get('/auth/config').then((r) => r.data),

  // Password reset via emailed OTP.
  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (email, otp, new_password) =>
    apiClient
      .post('/auth/reset-password', { email, otp, new_password })
      .then((r) => r.data),
};
