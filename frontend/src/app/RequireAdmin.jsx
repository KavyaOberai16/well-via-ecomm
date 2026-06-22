import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store.js';

/**
 * Guard for the whole admin shell. Admits anyone marked as staff:
 *   - `is_admin=True` (full bypass), or
 *   - at least one assigned role (i.e. a staff account, not a shopper).
 *
 * Page-level routes inside the shell further restrict by specific permission
 * via <RequirePermission>. Server endpoints independently enforce the same
 * permission via require_permission().
 */
export default function RequireAdmin({ children }) {
  const location = useLocation();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!user) return null;  // /auth/me bootstrap in flight

  const isStaff = !!user.is_admin || (Array.isArray(user.roles) && user.roles.length > 0);
  if (!isStaff) {
    return <Navigate to="/" replace />;
  }
  return children;
}
