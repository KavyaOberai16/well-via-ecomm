import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { taxesApi } from './api.js';

const KEY = ['taxes'];

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useTaxes() {
  return useQuery({
    queryKey: KEY,
    queryFn: taxesApi.list,
  });
}

export function useCreateTax() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data) => taxesApi.create(data),
    onSuccess: invalidate,
  });
}

export function useUpdateTax() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => taxesApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteTax() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id) => taxesApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useSetProductTaxes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, taxIds }) =>
      taxesApi.setProductTaxes(productId, taxIds),
    onSuccess: (_data, { productId }) => {
      // The product detail query caches by id — invalidate both shapes.
      qc.invalidateQueries({ queryKey: ['products', String(productId)] });
      qc.invalidateQueries({ queryKey: ['products', Number(productId)] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
