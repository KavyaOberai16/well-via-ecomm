import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { authApi } from '@/features/auth/api.js';
import { useAuthStore } from '@/features/auth/store.js';
import { duration, ease } from '@/lib/motion.js';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

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
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-content items-center justify-center px-6 py-12">
      {/* ambient glow */}
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

            <Button type="submit" block size="lg" loading={busy} className="mt-2">
              {isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>

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
