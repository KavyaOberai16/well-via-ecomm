import { apiClient } from '@/services/apiClient.js';

export const paymentGatewayApi = {
  get: () => apiClient.get('/payment-gateway').then((r) => r.data),
  update: (data) => apiClient.put('/payment-gateway', data).then((r) => r.data),
};
