import { apiClient } from '@/services/apiClient.js';

export const categoriesApi = {
  list: () => apiClient.get('/categories').then((r) => r.data),
  create: (data) => apiClient.post('/categories', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/categories/${id}`),
  uploadImage: (id, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post(`/categories/${id}/image`, form, { timeout: 60000 })
      .then((r) => r.data);
  },
  removeImage: (id) => apiClient.delete(`/categories/${id}/image`).then((r) => r.data),
};
