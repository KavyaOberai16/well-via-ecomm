import { useEffect, useRef } from 'react';
import { authApi } from '@/features/auth/api.js';
import { useAuthStore } from '@/features/auth/store.js';

/**
 * One-shot effect that runs after the persisted store hydrates. Re-fetches
 * /auth/me when an access token is present, so the user object always carries
 * the latest roles + permissions (the persisted copy may pre-date an RBAC
 * change made by an admin).
 *
 * Renders nothing.
 */
export default function AuthBootstrap() {
  const token = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const fetched = useRef(false);

  useEffect(() => {
    if (!token || fetched.current) return;
    fetched.current = true;
    authApi.me().then(setUser).catch((err) => {
      // 401 → the interceptor already cleared the session. Any other error,
      // we leave the persisted user in place; they can still navigate.
      if (err?.response?.status === 401) logout();
    });
  }, [token, setUser, logout]);

  return null;
}
