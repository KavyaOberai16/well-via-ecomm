import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient.js';

/**
 * Public storefront settings — free-shipping threshold, trust badges, etc.
 * Hand-curated allowlist on the backend so nothing secret leaks.
 *
 * Cached for an hour: these change rarely and the storefront should not
 * re-fetch on every navigation.
 */
export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => apiClient.get('/settings/public').then((r) => r.data),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
