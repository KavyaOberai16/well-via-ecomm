import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentGatewayApi } from './api.js';

const KEY = ['payment-gateway'];

export function usePaymentGateway() {
  return useQuery({
    queryKey: KEY,
    queryFn: paymentGatewayApi.get,
  });
}

export function useUpdatePaymentGateway() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => paymentGatewayApi.update(data),
    onSuccess: (data) => {
      // The PUT returns the fresh (masked) config — seed the cache directly.
      qc.setQueryData(KEY, data);
    },
  });
}
