import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from './api.js';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });
}

function useCategoryInvalidation() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['categories'] });
}

export function useCreateCategory() {
  const invalidate = useCategoryInvalidation();
  return useMutation({
    mutationFn: (data) => categoriesApi.create(data),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useCategoryInvalidation();
  return useMutation({
    mutationFn: (id) => categoriesApi.remove(id),
    onSuccess: invalidate,
  });
}
