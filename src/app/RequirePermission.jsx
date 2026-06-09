import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store.js';

/**
 * Page-level guard. Use for individual routes inside the admin shell when
 * a permission gate is finer than "is staff".
 *
 *   <Route path="/admin/coupons" element={
 *     <RequirePermission permission="coupons.view"><AdminCouponsPage/></RequirePermission>
 *   } />
 *
 * Note this is UX only — every API call independently enforces the same
 * permission server-side via require_permission().
 */
export default function RequirePermission({ permission, children, fallback = '/admin' }) {
  const location = useLocation();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!user) return null;  // bootstrap in flight

  const allowed =
    user.is_admin ||
    (Array.isArray(user.permissions) && user.permissions.includes(permission));

  if (!allowed) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}
