import { apiClient } from '@/services/apiClient.js';

export const reviewsApi = {
  // ----- Public / user -----
  listForProduct: (productId, { page = 1, page_size = 10, sort = 'newest' } = {}) =>
    apiClient
      .get(`/products/${productId}/reviews`, { params: { page, page_size, sort } })
      .then((r) => r.data),

  create: (productId, data) =>
    apiClient.post(`/products/${productId}/reviews`, data).then((r) => r.data),

  updateOwn: (reviewId, data) =>
    apiClient.patch(`/reviews/${reviewId}`, data).then((r) => r.data),

  removeOwn: (reviewId) => apiClient.delete(`/reviews/${reviewId}`),

  // ----- Admin -----
  adminList: ({ q, product_id, rating, approved, page = 1, page_size = 50 } = {}) => {
    const params = { page, page_size };
    if (q) params.q = q;
    if (product_id != null) params.product_id = product_id;
    if (rating != null) params.rating = rating;
    if (approved != null) params.approved = approved;
    return apiClient.get('/reviews/admin', { params }).then((r) => r.data);
  },

  adminCreate: (data) =>
    apiClient.post('/reviews/admin', data).then((r) => r.data),

  adminUpdate: (reviewId, data) =>
    apiClient.patch(`/reviews/admin/${reviewId}`, data).then((r) => r.data),

  adminRemove: (reviewId) => apiClient.delete(`/reviews/admin/${reviewId}`),
};
