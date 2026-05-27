import { apiClient } from '@/services/apiClient.js';

export const loyaltyApi = {
  // User-facing
  me: () => apiClient.get('/loyalty/me').then((r) => r.data),
  myTransactions: ({ page = 1, page_size = 20 } = {}) =>
    apiClient
      .get('/loyalty/me/transactions', { params: { page, page_size } })
      .then((r) => r.data),
  tiers: () => apiClient.get('/loyalty/tiers').then((r) => r.data),
  redeem: (tier_id) =>
    apiClient.post('/loyalty/redeem', { tier_id }).then((r) => r.data),

  // Admin
  adminUserLoyalty: (userId) =>
    apiClient.get(`/loyalty/admin/users/${userId}`).then((r) => r.data),
  adminAdjust: (userId, delta, description) =>
    apiClient
      .post(`/loyalty/admin/users/${userId}/adjust`, { delta, description })
      .then((r) => r.data),
  adminListTiers: () =>
    apiClient.get('/loyalty/admin/tiers').then((r) => r.data),
  adminCreateTier: (data) =>
    apiClient.post('/loyalty/admin/tiers', data).then((r) => r.data),
  adminUpdateTier: (tierId, data) =>
    apiClient.patch(`/loyalty/admin/tiers/${tierId}`, data).then((r) => r.data),
  adminDeleteTier: (tierId) =>
    apiClient.delete(`/loyalty/admin/tiers/${tierId}`),

  // Referrals
  myReferralOverview: () =>
    apiClient.get('/loyalty/me/referral').then((r) => r.data),
  myReferrals: ({ page = 1, page_size = 20 } = {}) =>
    apiClient
      .get('/loyalty/me/referrals', { params: { page, page_size } })
      .then((r) => r.data),
  adminListReferrals: ({ status, page = 1, page_size = 50 } = {}) => {
    const params = { page, page_size };
    if (status) params.status = status;
    return apiClient.get('/loyalty/admin/referrals', { params }).then((r) => r.data);
  },

  // Expiry
  adminExpirePoints: () =>
    apiClient.post('/loyalty/admin/expire-points').then((r) => r.data),

  // Earn rules
  adminListEarnRules: () =>
    apiClient.get('/loyalty/admin/earn-rules').then((r) => r.data),
  adminUpdateEarnRule: (ruleId, data) =>
    apiClient
      .patch(`/loyalty/admin/earn-rules/${ruleId}`, data)
      .then((r) => r.data),

  // VIP tiers
  adminListVipTiers: () =>
    apiClient.get('/loyalty/admin/vip-tiers').then((r) => r.data),
  adminCreateVipTier: (data) =>
    apiClient.post('/loyalty/admin/vip-tiers', data).then((r) => r.data),
  adminUpdateVipTier: (tierId, data) =>
    apiClient
      .patch(`/loyalty/admin/vip-tiers/${tierId}`, data)
      .then((r) => r.data),
  adminDeleteVipTier: (tierId) =>
    apiClient.delete(`/loyalty/admin/vip-tiers/${tierId}`),
};
