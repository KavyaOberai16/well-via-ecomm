import { apiClient } from '@/services/apiClient.js';

export const codApi = {
  // Optional auth — the api client attaches the bearer token automatically
  // when the user is signed in. Server uses the user to apply first-time /
  // RTO gates; anonymous calls skip those gates.
  check: ({ items, destination_pincode }) =>
    apiClient
      .post('/cod/check', { items, destination_pincode })
      .then((r) => r.data),

  // OTP flow for COD orders. Requires auth (the OTP is keyed off the
  // user + phone). Server enforces rate limits + max-attempts.
  sendOtp: (phone) =>
    apiClient.post('/cod/send-otp', { phone }).then((r) => r.data),
  verifyOtp: (phone, code) =>
    apiClient.post('/cod/verify-otp', { phone, code }).then((r) => r.data),
};
