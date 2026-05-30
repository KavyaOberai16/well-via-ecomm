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

export function useUpdateCategory() {
  const invalidate = useCategoryInvalidation();
  return useMutation({
    mutationFn: ({ id, data }) => categoriesApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useUploadCategoryImage() {
  const invalidate = useCategoryInvalidation();
  return useMutation({
    mutationFn: ({ id, file }) => categoriesApi.uploadImage(id, file),
    onSuccess: invalidate,
  });
}

export function useRemoveCategoryImage() {
  const invalidate = useCategoryInvalidation();
  return useMutation({
    mutationFn: (id) => categoriesApi.removeImage(id),
    onSuccess: invalidate,
  });
}
