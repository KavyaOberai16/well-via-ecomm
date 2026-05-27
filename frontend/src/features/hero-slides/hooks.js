import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { heroSlidesApi } from './api.js';

const KEY = ['hero-slides'];

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useHeroSlides() {
  return useQuery({
    queryKey: KEY,
    queryFn: heroSlidesApi.list,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminHeroSlides() {
  return useQuery({
    queryKey: [...KEY, 'all'],
    queryFn: heroSlidesApi.listAll,
  });
}

export function useCreateHeroSlide() {
  const invalidate = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => heroSlidesApi.create(data),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: [...KEY, 'all'] });
    },
  });
}

export function useUpdateHeroSlide() {
  const invalidate = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => heroSlidesApi.update(id, data),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: [...KEY, 'all'] });
    },
  });
}

export function useDeleteHeroSlide() {
  const invalidate = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => heroSlidesApi.remove(id),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: [...KEY, 'all'] });
    },
  });
}

export function useReorderHeroSlides() {
  const invalidate = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => heroSlidesApi.reorder(ids),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: [...KEY, 'all'] });
    },
  });
}
