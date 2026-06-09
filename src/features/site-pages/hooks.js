import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sitePagesApi } from './api.js';

const KEY = ['site-pages'];

export function useSitePages() {
  return useQuery({
    queryKey: KEY,
    queryFn: sitePagesApi.get,
    // Public storefront content — stale after 5 minutes, but renders instantly
    // from cache while revalidating in the background.
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSitePages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => sitePagesApi.update(data),
    onSuccess: (data) => {
      // The PUT returns the complete saved document — seed the cache directly
      // so the storefront updates without a round-trip fetch.
      qc.setQueryData(KEY, data);
    },
  });
}
