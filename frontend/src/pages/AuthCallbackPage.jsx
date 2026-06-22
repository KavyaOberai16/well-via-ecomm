import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button.jsx';
import { authApi } from '@/features/auth/api.js';
import { useAuthStore } from '@/features/auth/store.js';

const ERROR_MESSAGES = {
  state: 'Security check failed. Please try signing in again.',
  google: "Google sign-in didn't complete. Please try again.",
  google_disabled: 'Google sign-in is not enabled for this store.',
  disabled: 'Your account has been disabled.',
};

/**
 * Lands here after the backend's Google OAuth callback. The backend appends
 * tokens (or an error) to the URL fragment; this page consumes them.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const error = params.get('error');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (error || !accessToken) {
      setErrorMsg(ERROR_MESSAGES[error] || 'Sign-in failed. Please try again.');
      return;
    }

    let cancelled = false;
    (async () => {
      setSession({ user: null, accessToken, refreshToken });
      let profile = null;
      try {
        profile = await authApi.me();
        setUser(profile);
      } catch {
        /* profile is non-critical for storefront use */
      }
      // Strip tokens from the visible URL.
      window.history.replaceState(null, '', '/auth/callback');
      if (!cancelled) navigate(profile?.is_admin ? '/admin' : '/', { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, setSession, setUser]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-content items-center justify-center px-6 py-12">
      {errorMsg ? (
        <div className="flex max-w-sm flex-col items-center text-center">
          <span className="grid size-12 place-items-center rounded-full bg-danger/15 text-danger">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-h2 text-ink-primary">Sign-in failed</h1>
          <p className="mt-1 text-sm text-ink-secondary">{errorMsg}</p>
          <Link to="/login" className="mt-6">
            <Button size="lg">Back to sign in</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-ink-secondary">
          <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          <p className="text-sm">Signing you in…</p>
        </div>
      )}
    </main>
  );
}
