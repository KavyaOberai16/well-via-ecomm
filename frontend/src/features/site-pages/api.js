import { apiClient } from '@/services/apiClient.js';

export const sitePagesApi = {
  get: () => apiClient.get('/site-pages').then((r) => r.data),
  update: (data) => apiClient.put('/site-pages', data).then((r) => r.data),
};
