import { apiClient } from '@/services/apiClient.js';

export const returnsApi = {
  // Customer
  create: (payload) =>
    apiClient.post('/returns', payload).then((r) => r.data),
  listMine: () => apiClient.get('/returns').then((r) => r.data),
  getMine: (id) => apiClient.get(`/returns/${id}`).then((r) => r.data),
  cancel: (id) =>
    apiClient.post(`/returns/${id}/cancel`, {}).then((r) => r.data),

  // Admin
  adminList: (status) =>
    apiClient
      .get('/returns/admin', { params: status ? { status } : {} })
      .then((r) => r.data),
  adminGet: (id) => apiClient.get(`/returns/admin/${id}`).then((r) => r.data),
  adminApprove: (id, payload) =>
    apiClient.post(`/returns/admin/${id}/approve`, payload).then((r) => r.data),
  adminReject: (id, payload) =>
    apiClient.post(`/returns/admin/${id}/reject`, payload).then((r) => r.data),
  adminMarkPickedUp: (id) =>
    apiClient.post(`/returns/admin/${id}/mark-picked-up`, {}).then((r) => r.data),
  adminMarkReceived: (id) =>
    apiClient.post(`/returns/admin/${id}/mark-received`, {}).then((r) => r.data),
  adminMarkRefunded: (id) =>
    apiClient.post(`/returns/admin/${id}/mark-refunded`, {}).then((r) => r.data),
};
