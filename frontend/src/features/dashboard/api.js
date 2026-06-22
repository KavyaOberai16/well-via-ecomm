import { apiClient } from '@/services/apiClient.js';

export const dashboardApi = {
  overview: (period = '30d') =>
    apiClient
      .get('/dashboard/overview', { params: { period } })
      .then((r) => r.data),
};
