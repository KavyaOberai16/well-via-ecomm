import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      // setTokens swaps just the token pair (e.g. after a refresh rotates).
      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      // Mirrors backend User.has_permission — admin bypasses; otherwise check
      // the flat permissions list shipped on /auth/me.
      hasPermission: (perm) => {
        const u = get().user;
        if (!u) return false;
        if (u.is_admin) return true;
        return Array.isArray(u.permissions) && u.permissions.includes(perm);
      },

      // True if the user is part of staff — used to gate the whole admin shell.
      // Admin flag OR any assigned role counts.
      isStaff: () => {
        const u = get().user;
        if (!u) return false;
        return !!u.is_admin || (Array.isArray(u.roles) && u.roles.length > 0);
      },
    }),
    { name: 'auth' }
  )
);

/** Selector hook — re-renders when the relevant slice changes. */
export function useHasPermission(perm) {
  return useAuthStore((s) => {
    if (!s.user) return false;
    if (s.user.is_admin) return true;
    return Array.isArray(s.user.permissions) && s.user.permissions.includes(perm);
  });
}
