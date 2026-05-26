import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store.js';

/**
 * Route guard for the admin area. Client-side UX only — every admin API
 * endpoint independently enforces `require_admin` on the server.
 */
export default function RequireAdmin({ children }) {
  const location = useLocation();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
