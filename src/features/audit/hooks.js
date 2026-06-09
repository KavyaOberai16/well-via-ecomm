import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { auditApi } from './api.js';

export function useAuditEvents(opts = {}) {
  return useQuery({
    queryKey: ['audit', opts],
    queryFn: () => auditApi.list(opts),
    placeholderData: keepPreviousData,
  });
}
