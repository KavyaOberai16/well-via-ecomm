import { apiClient } from '@/services/apiClient.js';

export const wishlistApi = {
  list: () => apiClient.get('/wishlist').then((r) => r.data),
  add: (product_id) =>
    apiClient.post('/wishlist', { product_id }).then((r) => r.data),
  remove: (product_id) => apiClient.delete(`/wishlist/${product_id}`),
};
