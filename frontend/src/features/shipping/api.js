import { apiClient } from '@/services/apiClient.js';

export const shippingApi = {
  // Public endpoint — anonymous shoppers can check delivery before signing up.
  checkServiceability: (pincode) =>
    apiClient
      .get(`/shipping/serviceability/${encodeURIComponent(pincode)}`)
      .then((r) => r.data),

  // Public rate quote. Server reads weights/prices from the products table,
  // so the body only needs (product_id, quantity).
  quoteRate: ({ destination_pincode, items }) =>
    apiClient
      .post('/shipping/rate-quote', { destination_pincode, items })
      .then((r) => r.data),
};
