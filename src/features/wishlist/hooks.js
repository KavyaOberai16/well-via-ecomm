import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from './api.js';
import { useAuthStore } from '@/features/auth/store.js';

const KEY = ['wishlist'];

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useWishlist() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: KEY,
    queryFn: wishlistApi.list,
    // Wishlist is per-user — skip the doomed request when signed out.
    enabled: !!token,
    retry: false,
  });
}

export function useAddToWishlist() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (productId) => wishlistApi.add(productId),
    onSuccess: invalidate,
  });
}

export function useRemoveFromWishlist() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (productId) => wishlistApi.remove(productId),
    onSuccess: invalidate,
  });
}

/** True iff the given product is currently in the user's wishlist. */
export function useIsInWishlist(productId) {
  const { data } = useWishlist();
  if (!productId || !data) return false;
  return data.some((item) => item.product_id === Number(productId));
}
