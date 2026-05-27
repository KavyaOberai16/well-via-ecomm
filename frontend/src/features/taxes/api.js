import { apiClient } from '@/services/apiClient.js';

export const taxesApi = {
  list: () => apiClient.get('/taxes').then((r) => r.data),
  create: (data) => apiClient.post('/taxes', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/taxes/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/taxes/${id}`),

  // Replaces the product's tax list.
  setProductTaxes: (productId, taxIds) =>
    apiClient
      .put(`/taxes/products/${productId}`, { tax_ids: taxIds })
      .then((r) => r.data),
};
