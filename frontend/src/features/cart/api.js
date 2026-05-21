import { apiClient } from '@/services/apiClient.js';

export const cartApi = {
  get: () => apiClient.get('/cart').then((r) => r.data),
  addItem: (product_id, quantity) =>
    apiClient.post('/cart/items', { product_id, quantity }),
  removeItem: (product_id) => apiClient.delete(`/cart/items/${product_id}`),
  clear: () => apiClient.delete('/cart'),
};
