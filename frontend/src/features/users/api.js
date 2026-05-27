import { apiClient } from '@/services/apiClient.js';

export const usersApi = {
  list: ({ q, page = 1, page_size = 50 } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', String(page));
    params.set('page_size', String(page_size));
    return apiClient.get(`/users?${params.toString()}`).then((r) => r.data);
  },

  get: (id) => apiClient.get(`/users/${id}`).then((r) => r.data),
};
