import { apiClient } from '@/services/apiClient.js';

export const paymentsApi = {
  // Create order + initiate payment in one round-trip. Server returns the
  // redirect URL we then send the browser to.
  checkout: ({
    items,
    shipping_address,
    shipping_pincode,
    payment_method,
    currency,
    coupon_code,
  }) =>
    apiClient
      .post('/checkout', {
        items,
        shipping_address,
        currency,
        // Only include when set — the backend's pydantic schema treats null
        // and absent the same, but cleaner request payloads ease debugging.
        ...(shipping_pincode ? { shipping_pincode } : {}),
        ...(payment_method ? { payment_method } : {}),
        ...(coupon_code ? { coupon_code } : {}),
      })
      .then((r) => r.data),

  // Polled by the return page; backend will fetch_status from the provider
  // if the order is still PENDING.
  status: (mtid) =>
    apiClient.get(`/payments/${mtid}/status`).then((r) => r.data),

  orderForPayment: (mtid) =>
    apiClient.get(`/payments/${mtid}/order`).then((r) => r.data),

  // Mock simulator only — equivalent to PhonePe's signed webhook.
  mockDecision: (mtid, action) =>
    apiClient
      .post('/payments/webhook/mock', {
        merchant_transaction_id: mtid,
        action,
      })
      .then((r) => r.data),
};
