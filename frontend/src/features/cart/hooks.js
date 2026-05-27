import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from './api.js';
import { useAuthStore } from '@/features/auth/store.js';

const CART_KEY = ['cart'];

function useInvalidateCart() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: CART_KEY });
}

export function useCart() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: CART_KEY,
    queryFn: cartApi.get,
    // The cart is per-user — don't fire a doomed request when signed out.
    enabled: !!token,
    retry: false,
  });
}

export function useAddToCart() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: ({ productId, quantity = 1 }) => cartApi.addItem(productId, quantity),
    onSuccess: invalidate,
  });
}

export function useRemoveFromCart() {
  const invalidate = useInvalidateCart();
  return useMutation({
    mutationFn: (productId) => cartApi.removeItem(productId),
    onSuccess: invalidate,
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code) => cartApi.applyCoupon(code),
    // The endpoint returns the full updated cart — write it straight to cache
    // so the UI doesn't need a follow-up refetch.
    onSuccess: (data) => qc.setQueryData(CART_KEY, data),
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: (data) => qc.setQueryData(CART_KEY, data),
  });
}
