import { apiClient } from '@/services/apiClient.js';

export const adminOrdersApi = {
  list: ({ q, status, date_from, date_to, page = 1, page_size = 25 } = {}) => {
    const params = { page, page_size };
    if (q) params.q = q;
    if (status) params.status = status;
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;
    return apiClient.get('/orders/admin', { params }).then((r) => r.data);
  },
  get: (id) => apiClient.get(`/orders/admin/${id}`).then((r) => r.data),
  ship: (id, data) =>
    apiClient.post(`/orders/admin/${id}/ship`, data).then((r) => r.data),
  deliver: (id) =>
    apiClient.post(`/orders/admin/${id}/deliver`, {}).then((r) => r.data),
  cancel: (id, reason) =>
    apiClient
      .post(`/orders/admin/${id}/cancel`, { reason })
      .then((r) => r.data),
  refund: (id, reason) =>
    apiClient
      .post(`/orders/admin/${id}/refund`, { reason })
      .then((r) => r.data),
  updateNotes: (id, internal_notes) =>
    apiClient
      .patch(`/orders/admin/${id}/notes`, { internal_notes })
      .then((r) => r.data),
};
