import { apiClient } from '@/services/apiClient.js';

export const footerApi = {
  get: () => apiClient.get('/footer').then((r) => r.data),
  update: (data) => apiClient.put('/footer', data).then((r) => r.data),

  // Upload a brand logo image; returns { url }. Uploads need more headroom
  // than the default API timeout.
  uploadLogo: (file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post('/footer/logo', form, { timeout: 60000 })
      .then((r) => r.data);
  },
};
