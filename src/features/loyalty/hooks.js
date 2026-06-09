import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi } from './api.js';
import { useAuthStore } from '@/features/auth/store.js';

const ME_KEY = ['loyalty', 'me'];
const TIERS_KEY = ['loyalty', 'tiers'];
const ADMIN_TIERS_KEY = ['loyalty', 'admin', 'tiers'];

function useInvalidateAll() {
  const qc = useQueryClient();
  return (userId) => {
    qc.invalidateQueries({ queryKey: ['loyalty'] });
    if (userId != null) qc.invalidateQueries({ queryKey: ['loyalty', 'admin', 'user', userId] });
    // /auth/me carries points_balance via the user object — bump it too.
    qc.invalidateQueries({ queryKey: ['auth', 'me'] });
  };
}

export function useMyLoyalty() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ME_KEY,
    queryFn: loyaltyApi.me,
    enabled: !!token,
    retry: false,
  });
}

export function useMyTransactions(opts = {}) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['loyalty', 'me', 'transactions', opts],
    queryFn: () => loyaltyApi.myTransactions(opts),
    enabled: !!token,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useTiers() {
  return useQuery({
    queryKey: TIERS_KEY,
    queryFn: loyaltyApi.tiers,
  });
}

export function useRedeemTier() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (tierId) => loyaltyApi.redeem(tierId),
    onSuccess: () => invalidate(),
  });
}

// ---- Admin ----

export function useAdminUserLoyalty(userId) {
  return useQuery({
    queryKey: ['loyalty', 'admin', 'user', userId],
    queryFn: () => loyaltyApi.adminUserLoyalty(userId),
    enabled: userId != null,
  });
}

export function useAdminAdjust() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ userId, delta, description }) =>
      loyaltyApi.adminAdjust(userId, delta, description),
    onSuccess: (_data, vars) => invalidate(vars.userId),
  });
}

export function useAdminTiers() {
  return useQuery({
    queryKey: ADMIN_TIERS_KEY,
    queryFn: loyaltyApi.adminListTiers,
  });
}

export function useAdminCreateTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => loyaltyApi.adminCreateTier(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_TIERS_KEY });
      qc.invalidateQueries({ queryKey: TIERS_KEY });
    },
  });
}

export function useAdminUpdateTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, data }) => loyaltyApi.adminUpdateTier(tierId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_TIERS_KEY });
      qc.invalidateQueries({ queryKey: TIERS_KEY });
    },
  });
}

export function useAdminDeleteTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tierId) => loyaltyApi.adminDeleteTier(tierId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_TIERS_KEY });
      qc.invalidateQueries({ queryKey: TIERS_KEY });
    },
  });
}

// ---- Referrals ----

export function useMyReferralOverview() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['loyalty', 'me', 'referral'],
    queryFn: loyaltyApi.myReferralOverview,
    enabled: !!token,
    retry: false,
  });
}

export function useMyReferrals(opts = {}) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['loyalty', 'me', 'referrals', opts],
    queryFn: () => loyaltyApi.myReferrals(opts),
    enabled: !!token,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useAdminReferrals(opts = {}) {
  return useQuery({
    queryKey: ['loyalty', 'admin', 'referrals', opts],
    queryFn: () => loyaltyApi.adminListReferrals(opts),
    placeholderData: keepPreviousData,
  });
}

// ---- Expiry ----

export function useAdminExpirePoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => loyaltyApi.adminExpirePoints(),
    onSuccess: () => {
      // After running expiry, every loyalty view may have changed.
      qc.invalidateQueries({ queryKey: ['loyalty'] });
    },
  });
}

// ---- Earn rules ----

const EARN_RULES_KEY = ['loyalty', 'admin', 'earn-rules'];

export function useAdminEarnRules() {
  return useQuery({
    queryKey: EARN_RULES_KEY,
    queryFn: loyaltyApi.adminListEarnRules,
  });
}

export function useAdminUpdateEarnRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }) => loyaltyApi.adminUpdateEarnRule(ruleId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EARN_RULES_KEY }),
  });
}

// ---- VIP tiers ----

const VIP_TIERS_KEY = ['loyalty', 'admin', 'vip-tiers'];

export function useAdminVipTiers() {
  return useQuery({
    queryKey: VIP_TIERS_KEY,
    queryFn: loyaltyApi.adminListVipTiers,
  });
}

export function useAdminCreateVipTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => loyaltyApi.adminCreateVipTier(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VIP_TIERS_KEY });
      qc.invalidateQueries({ queryKey: ['loyalty', 'me'] });
    },
  });
}

export function useAdminUpdateVipTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tierId, data }) => loyaltyApi.adminUpdateVipTier(tierId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VIP_TIERS_KEY });
      qc.invalidateQueries({ queryKey: ['loyalty', 'me'] });
    },
  });
}

export function useAdminDeleteVipTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tierId) => loyaltyApi.adminDeleteVipTier(tierId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VIP_TIERS_KEY });
      qc.invalidateQueries({ queryKey: ['loyalty', 'me'] });
    },
  });
}
