import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { shippingApi } from './api.js';

/**
 * Lazy serviceability check.
 *
 * Stays disabled until `pincode` is a 6-digit string so we don't fire one
 * request per keystroke. The query key includes the pincode so React Query
 * deduplicates per pin and caches in-memory; the backend caches in Redis.
 */
export function useServiceability(pincode) {
  const clean = (pincode || '').trim();
  const enabled = /^\d{6}$/.test(clean);
  return useQuery({
    queryKey: ['shipping', 'serviceability', clean],
    queryFn: () => shippingApi.checkServiceability(clean),
    enabled,
    // Match the backend cache horizon so re-mounts don't re-fetch needlessly.
    staleTime: 10 * 60 * 1000, // 10 min
    retry: false,
  });
}

/**
 * Quote shipping cost for a cart.
 *
 * `items` should be `[{ product_id, quantity }]`. The query key uses a
 * normalized signature so two re-renders with the same cart don't re-fetch.
 */
export function useRateQuote(pincode, items) {
  const clean = (pincode || '').trim();
  const normalized = useMemo(
    () =>
      (items || [])
        .filter((i) => i?.product_id && i?.quantity > 0)
        .map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
    [items],
  );
  const signature = normalized
    .map((i) => `${i.product_id}x${i.quantity}`)
    .join(',');
  const enabled = /^\d{6}$/.test(clean) && normalized.length > 0;
  return useQuery({
    queryKey: ['shipping', 'rate-quote', clean, signature],
    queryFn: () =>
      shippingApi.quoteRate({ destination_pincode: clean, items: normalized }),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
