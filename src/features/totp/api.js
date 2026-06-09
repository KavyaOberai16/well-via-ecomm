import { apiClient } from '@/services/apiClient.js';

export const totpApi = {
  start: () => apiClient.post('/auth/me/totp/start').then((r) => r.data),
  confirm: (code) =>
    apiClient.post('/auth/me/totp/confirm', { code }).then((r) => r.data),
  disable: () => apiClient.post('/auth/me/totp/disable').then(() => {}),
};
