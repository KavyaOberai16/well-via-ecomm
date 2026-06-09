import { apiClient } from '@/services/apiClient.js';

export const heroSlidesApi = {
  list: () =>
    apiClient.get('/hero-slides').then((r) => r.data),

  listAll: () =>
    apiClient.get('/hero-slides/all').then((r) => r.data),

  // Create a slide with its image plus any content fields in one request.
  // `fields` may carry alt, kind, eyebrow, heading, subtext, badge_text,
  // cta_label/href, cta2_label/href, countdown_end, countdown_label, text_theme
  // and `perks` (an array, sent JSON-encoded).
  create: ({ file, ...fields }) => {
    const form = new FormData();
    form.append('file', file);
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null || value === '') continue;
      form.append(key, key === 'perks' ? JSON.stringify(value) : value);
    }
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
