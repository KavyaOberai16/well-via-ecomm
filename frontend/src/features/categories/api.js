import { apiClient } from '@/services/apiClient.js';

export const categoriesApi = {
  list: () => apiClient.get('/categories').then((r) => r.data),
  create: (data) => apiClient.post('/categories', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/categories/${id}`),
};
