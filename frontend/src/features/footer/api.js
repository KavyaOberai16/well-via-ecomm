import { apiClient } from '@/services/apiClient.js';

export const footerApi = {
  get: () => apiClient.get('/footer').then((r) => r.data),
  update: (data) => apiClient.put('/footer', data).then((r) => r.data),
};
