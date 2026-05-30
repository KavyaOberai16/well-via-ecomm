import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { footerApi } from './api.js';

const KEY = ['footer'];

export function useFooterConfig() {
  return useQuery({
    queryKey: KEY,
    queryFn: footerApi.get,
    // Public storefront data — stale after 5 minutes, but renders instantly
    // from cache while revalidating in the background.
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateFooterConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => footerApi.update(data),
    onSuccess: (data) => {
      // The PUT returns the complete saved document — seed the cache directly
      // so the storefront footer updates without a round-trip fetch.
      qc.setQueryData(KEY, data);
    },
  });
}
