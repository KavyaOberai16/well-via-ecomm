import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from './api.js';
import { useAuthStore } from '@/features/auth/store.js';

export function useCart() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    // The cart is per-user — don't fire a doomed request when signed out.
    enabled: !!token,
    retry: false,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity = 1 }) => cartApi.addItem(productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId) => cartApi.removeItem(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}
