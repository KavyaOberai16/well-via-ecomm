import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient.js';

export const instrumentsApi = {
  list: () => apiClient.get('/payments/instruments').then((r) => r.data),
};

/**
 * Returns the configured payment-instrument list. Always-on query — the
 * picker needs it the moment the customer hits checkout; stale data here
 * is harmless (the backend re-checks on submit).
 */
export function usePaymentInstruments() {
  return useQuery({
    queryKey: ['payments', 'instruments'],
    queryFn: instrumentsApi.list,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
