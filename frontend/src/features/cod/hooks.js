import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { codApi } from './api.js';

/**
 * Reports whether COD is available for the current cart + pincode.
 *
 * The query is keyed on a stable cart signature so two re-renders with the
 * same line items don't refetch. Disabled until there's at least one item;
 * pincode is optional — when missing, the gate chain runs without the
 * carrier-serviceability check.
 */
export function useCodCheck(pincode, items) {
  const clean = (pincode || '').trim();
  const normalized = useMemo(
    () =>
      (items || [])
        .filter((i) => i?.product_id && i?.quantity > 0)
        .map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
        })),
    [items],
  );
  const signature = normalized
    .map((i) => `${i.product_id}x${i.quantity}`)
    .join(',');
  const enabled = normalized.length > 0;

  return useQuery({
    queryKey: ['cod', 'check', clean, signature],
    queryFn: () =>
      codApi.check({
        items: normalized,
        destination_pincode: /^\d{3,10}$/.test(clean) ? clean : null,
      }),
    enabled,
    staleTime: 60 * 1000, // 1 min — surcharge / gates rarely flip mid-session
    retry: false,
  });
}

export function useSendCodOtp() {
  return useMutation({
    mutationFn: (phone) => codApi.sendOtp(phone),
  });
}

export function useVerifyCodOtp() {
  return useMutation({
    mutationFn: ({ phone, code }) => codApi.verifyOtp(phone, code),
  });
}
