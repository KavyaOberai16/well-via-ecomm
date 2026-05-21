import { apiClient } from '@/services/apiClient.js';

export const productsApi = {
  list: (params = {}) =>
    apiClient.get('/products', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/products/${id}`).then((r) => r.data),
};
