import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles, Gift, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input.jsx';
import { Button, buttonVariants } from '@/components/ui/Button.jsx';
import { authApi } from '@/features/auth/api.js';
import { useAuthStore } from '@/features/auth/store.js';
import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from '@/features/loyalty/referralCapture.js';
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
  // 2FA challenge state. When the server tells us the account needs TOTP,
  // we hold onto the pending_token and switch the form to the code prompt.
  const [pendingTotp, setPendingTotp] = useState(null); // { token, email }
  const [totpCode, setTotpCode] = useState('');
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const nextUrl = search.get('next');
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

  // Show a "you were referred" banner when a code is sitting in sessionStorage.
  // Visible on the register tab so the friend understands why they're signing up.
  const pendingReferral = isRegister ? getPendingReferralCode() : null;

  async function finishLogin(tokens, emailHint) {
    setSession({
      user: { email: emailHint },
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
    const safeNext = nextUrl && nextUrl.startsWith('/') ? nextUrl : null;
    navigate(safeNext ?? (profile?.is_admin ? '/admin' : '/'));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isRegister) {
        const referralCode = getPendingReferralCode();
        await authApi.register({
          email: form.email,
          password: form.password,
          full_name: form.full_name || undefined,
          referral_code: referralCode || undefined,
        });
        // Clear the stashed code regardless — invalid codes won't help on
        // retry, and successful ones already created the referral row.
        clearPendingReferralCode();
      }
      const resp = await authApi.login(form.email, form.password);
      if (resp.needs_totp) {
        // Switch to the second-factor view; keep the email visible so the
        // user knows which account they're confirming.
        setPendingTotp({ token: resp.pending_token, email: form.email });
        setTotpCode('');
        return;
      }
      await finishLogin(resp, form.email);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTotpSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!pendingTotp) return;
    const cleaned = totpCode.trim();
    if (!cleaned) {
      setError('Enter the 6-digit code from your authenticator (or a backup code).');
      return;
    }
    setBusy(true);
    try {
      const tokens = await authApi.loginTotp(pendingTotp.token, cleaned);
      await finishLogin(tokens, pendingTotp.email);
    } catch (err) {
      setError(err.response?.data?.error?.message || "That code didn't match.");
    } finally {
      setBusy(false);
    }
  }

  if (currentUser) {
    const safeNext = nextUrl && nextUrl.startsWith('/') ? nextUrl : '/';
    return <Navigate to={safeNext} replace />;
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

          {pendingTotp ? (
            <form onSubmit={handleTotpSubmit} className="mt-6">
              <div className="mb-4 rounded-sm border border-accent/30 bg-accent/10 p-3 text-xs text-ink-secondary">
                <p className="flex items-center gap-1.5 font-medium text-ink-primary">
                  <ShieldCheck className="size-4 text-accent" />
                  Enter your authenticator code
                </p>
                <p className="mt-1">
                  Open your authenticator app and enter the 6-digit code for{' '}
                  <span className="font-mono">{pendingTotp.email}</span>. If you don&apos;t
                  have your device, use one of your backup codes instead.
                </p>
              </div>
              <Input
                label="6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                inputMode="text"
                autoComplete="one-time-code"
                error={error}
                autoFocus
              />
              <Button type="submit" block size="lg" loading={busy} className="mt-1">
                Verify and sign in
              </Button>
              <button
                type="button"
                onClick={() => {
                  setPendingTotp(null);
                  setTotpCode('');
                  setError(null);
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink-secondary focus-visible:focus-ring"
              >
                <ArrowLeft className="size-3" /> Use a different account
              </button>
            </form>
          ) : pendingReferral && (
            <div className="mt-5 flex items-start gap-2 rounded-sm border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-ink-primary">
              <Gift className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <span>
                You were invited by a friend. Sign up to claim your{' '}
                <strong>welcome reward</strong>.
                <span className="ml-1 font-mono text-[10px] text-ink-tertiary">
                  {pendingReferral}
                </span>
              </span>
            </div>
          )}

          {!pendingTotp && (
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
          )}

          {!pendingTotp && googleEnabled && (
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

          {!pendingTotp && (
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
          )}
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
