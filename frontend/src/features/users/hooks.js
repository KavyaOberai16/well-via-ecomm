import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usersApi } from './api.js';

export function useUsers({ q = '', page = 1, page_size = 50 } = {}) {
  return useQuery({
    queryKey: ['users', { q, page, page_size }],
    queryFn: () => usersApi.list({ q, page, page_size }),
    placeholderData: keepPreviousData,
  });
}

export function useUser(id) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.get(id),
    enabled: id != null,
  });
}
