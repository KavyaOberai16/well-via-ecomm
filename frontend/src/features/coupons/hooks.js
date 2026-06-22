import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from './api.js';

const KEY = ['coupons'];

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCoupons() {
  return useQuery({
    queryKey: KEY,
    queryFn: couponsApi.list,
  });
}

export function useCreateCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data) => couponsApi.create(data),
    onSuccess: invalidate,
  });
}

export function useUpdateCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => couponsApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteCoupon() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id) => couponsApi.remove(id),
    onSuccess: invalidate,
  });
}
