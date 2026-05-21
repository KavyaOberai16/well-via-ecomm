import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from './api.js';

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
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
