import { apiClient } from '@/services/apiClient.js';

export const couponsApi = {
  list: () => apiClient.get('/coupons').then((r) => r.data),
  get: (id) => apiClient.get(`/coupons/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/coupons', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/coupons/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/coupons/${id}`),
};
