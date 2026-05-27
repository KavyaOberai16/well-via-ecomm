import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminOrdersApi } from './api.js';

const LIST_KEY = (opts) => ['admin-orders', opts];
const DETAIL_KEY = (id) => ['admin-orders', 'detail', id];

function useInvalidate() {
  const qc = useQueryClient();
  return (id) => {
    qc.invalidateQueries({ queryKey: ['admin-orders'] });
    if (id != null) qc.invalidateQueries({ queryKey: DETAIL_KEY(id) });
  };
}

export function useAdminOrders(opts = {}) {
  return useQuery({
    queryKey: LIST_KEY(opts),
    queryFn: () => adminOrdersApi.list(opts),
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrder(id) {
  return useQuery({
    queryKey: DETAIL_KEY(id),
    queryFn: () => adminOrdersApi.get(id),
    enabled: id != null,
  });
}

export function useShipOrder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }) => adminOrdersApi.ship(id, data),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });
}

export function useDeliverOrder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id) => adminOrdersApi.deliver(id),
    onSuccess: (_d, id) => invalidate(id),
  });
}

export function useCancelOrder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }) => adminOrdersApi.cancel(id, reason),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });
}

export function useRefundOrder() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }) => adminOrdersApi.refund(id, reason),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });
}

export function useUpdateOrderNotes() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, internal_notes }) =>
      adminOrdersApi.updateNotes(id, internal_notes),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });
}
