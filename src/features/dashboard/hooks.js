import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api.js';

export function useDashboardOverview(period = '30d') {
  return useQuery({
    queryKey: ['dashboard', 'overview', period],
    queryFn: () => dashboardApi.overview(period),
    // Auto-refresh every 60s so an admin watching the page sees orders land.
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
