/**
 * Lightweight `?ref=` capture. Persists the code in sessionStorage so a
 * visitor who lands on `/?ref=REF-XXXXXX`, browses the catalog, and only later
 * decides to sign up, still has the code attached to their registration.
 *
 * Stored in *session* storage on purpose — it shouldn't leak across browser
 * sessions or between users on a shared device.
 */
const KEY = 'pending-referral-code';

export function captureReferralFromUrl(search = window.location.search) {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(search);
    const code = params.get('ref');
    if (code && code.trim()) {
      sessionStorage.setItem(KEY, code.trim().toUpperCase());
    }
  } catch {
    /* sessionStorage can throw in private mode — swallow silently */
  }
}

export function getPendingReferralCode() {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingReferralCode() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
