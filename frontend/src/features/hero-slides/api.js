import { apiClient } from '@/services/apiClient.js';

export const heroSlidesApi = {
  list: () =>
    apiClient.get('/hero-slides').then((r) => r.data),

  listAll: () =>
    apiClient.get('/hero-slides/all').then((r) => r.data),

  create: ({ file, alt }) => {
    const form = new FormData();
    form.append('file', file);
    if (alt) form.append('alt', alt);
    return apiClient
      .post('/hero-slides', form, { timeout: 60000 })
      .then((r) => r.data);
  },

  update: (id, data) =>
    apiClient.patch(`/hero-slides/${id}`, data).then((r) => r.data),

  remove: (id) =>
    apiClient.delete(`/hero-slides/${id}`),

  reorder: (ids) =>
    apiClient.post('/hero-slides/reorder', { ids }).then((r) => r.data),
};
