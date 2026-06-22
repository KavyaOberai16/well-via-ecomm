import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { authApi } from '@/features/auth/api.js';
import { duration, ease } from '@/lib/motion.js';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }
    setBusy(true);
    try {
      await authApi.forgotPassword(email.trim());
      setStep('reset');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError(null);
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await authApi.resetPassword(email.trim(), otp.trim(), password);
      setStep('done');
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'That code is invalid or has expired. Request a new one.',
      );
    } finally {
      setBusy(false);
    }
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
          {step === 'done' ? (
            <div className="flex flex-col items-center text-center">
              <span className="grid size-11 place-items-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-6" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-h2 text-ink-primary">Password reset</h1>
              <p className="mt-1 text-sm text-ink-secondary">
                Your password has been changed. You can now sign in with it.
              </p>
              <Button block size="lg" className="mt-6" onClick={() => navigate('/login')}>
                Go to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center">
                <span className="grid size-11 place-items-center rounded-sm bg-accent text-ink-inverse">
                  <KeyRound className="size-5" aria-hidden="true" />
                </span>
                <h1 className="mt-4 text-h2 text-ink-primary">
                  {step === 'request' ? 'Reset your password' : 'Enter your code'}
                </h1>
                <p className="mt-1 text-sm text-ink-secondary">
                  {step === 'request'
                    ? "We'll email you a 6-digit code to reset it."
                    : `We sent a code to ${email}. It expires in 10 minutes.`}
                </p>
              </div>

              {step === 'request' ? (
                <form onSubmit={handleRequest} className="mt-6">
                  <Input
                    label="Email"
                    type="email"
                    icon={Mail}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={error}
                  />
                  <Button type="submit" block size="lg" loading={busy} className="mt-2">
                    Send reset code
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleReset} className="mt-6">
                  <Input
                    label="6-digit code"
                    icon={KeyRound}
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                  <Input
                    label="New password"
                    type="password"
                    icon={Lock}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={error}
                    helper="At least 8 characters."
                  />
                  <Button type="submit" block size="lg" loading={busy} className="mt-2">
                    Reset password
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setError(null);
                      setOtp('');
                    }}
                    className="mt-3 w-full rounded-sm text-center text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {step !== 'done' && (
          <p className="mt-6 text-center text-xs text-ink-tertiary">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 rounded-sm transition-colors hover:text-ink-secondary focus-visible:focus-ring"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to sign in
            </Link>
          </p>
        )}
      </motion.div>
    </main>
  );
}
