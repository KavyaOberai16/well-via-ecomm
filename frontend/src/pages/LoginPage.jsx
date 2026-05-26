import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input.jsx';
import { Button, buttonVariants } from '@/components/ui/Button.jsx';
import { authApi } from '@/features/auth/api.js';
import { useAuthStore } from '@/features/auth/store.js';
import { cn } from '@/lib/utils.js';
import { env } from '@/config/env.js';
import { duration, ease } from '@/lib/motion.js';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const currentUser = useAuthStore((s) => s.user);

  const { data: authConfig } = useQuery({
    queryKey: ['auth-config'],
    queryFn: authApi.getConfig,
    staleTime: Infinity,
  });
  const googleEnabled = Boolean(authConfig?.google_login);

  const isRegister = mode === 'register';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) {
        await authApi.register({
          email: form.email,
          password: form.password,
          full_name: form.full_name || undefined,
        });
      }
      const tokens = await authApi.login(form.email, form.password);
      setSession({
        user: { email: form.email },
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      let profile = null;
      try {
        profile = await authApi.me();
        setUser(profile);
      } catch {
        /* profile is non-critical for storefront use */
      }
      navigate(profile?.is_admin ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-content items-center justify-center px-6 py-12">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 -z-10 size-[420px] -translate-x-1/2 rounded-full bg-accent/15 blur-[130px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.base, ease: ease.entrance }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-lg p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid size-11 place-items-center rounded-sm bg-accent text-ink-inverse">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-h2 text-ink-primary">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-ink-secondary">
              {isRegister
                ? 'Join Lumen for a faster, saved checkout.'
                : 'Sign in to continue shopping.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            {isRegister && (
              <Input
                label="Full name"
                icon={User}
                placeholder="Jane Doe"
                autoComplete="name"
                value={form.full_name}
                onChange={set('full_name')}
              />
            )}
            <Input
              label="Email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={form.email}
              onChange={set('email')}
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              value={form.password}
              onChange={set('password')}
              error={error}
              helper={isRegister ? 'At least 8 characters.' : undefined}
            />

            {!isRegister && (
              <div className="-mt-1 mb-3 text-right">
                <Link
                  to="/forgot-password"
                  className="rounded-sm text-sm text-accent transition-colors hover:text-accent-hover focus-visible:focus-ring"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <Button type="submit" block size="lg" loading={busy} className="mt-1">
              {isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          {googleEnabled && (
            <>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-line-subtle" />
                <span className="text-xs text-ink-tertiary">or</span>
                <span className="h-px flex-1 bg-line-subtle" />
              </div>
              <a
                href={`${env.backendUrl}/api/v1/auth/google/login`}
                className={cn(buttonVariants({ variant: 'secondary', size: 'lg', block: true }))}
              >
                <GoogleIcon />
                Continue with Google
              </a>
            </>
          )}

          <p className="mt-6 text-center text-sm text-ink-secondary">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(isRegister ? 'login' : 'register');
                setError(null);
              }}
              className="rounded-sm font-semibold text-accent transition-colors hover:text-accent-hover focus-visible:focus-ring"
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-ink-tertiary">
          <Link
            to="/products"
            className="rounded-sm transition-colors hover:text-ink-secondary focus-visible:focus-ring"
          >
            Continue browsing without signing in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
