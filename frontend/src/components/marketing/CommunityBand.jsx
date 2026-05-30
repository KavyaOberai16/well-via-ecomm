import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, ArrowRight, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils.js';

/**
 * "Join the community" newsletter band shown near the bottom of the homepage,
 * just above the footer. Client-side validation only — wires to a real list
 * later. Mirrors the dark, glowing aesthetic of the footer.
 */
export default function CommunityBand() {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function onSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
    setEmail('');
    window.setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <section className="mx-auto mt-20 max-w-content px-4 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="relative isolate overflow-hidden rounded-lg border border-white/10 px-7 py-10 text-white sm:px-12 sm:py-12"
        style={{ background: 'linear-gradient(115deg,#0d1230 0%,#1a1740 50%,#3a2a6b 100%)' }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-16 size-56 rounded-full bg-indigo-400/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 bottom-0 size-56 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div className="flex items-start gap-4">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg,#7C7FF5,#c084fc)' }}
            >
              <Sparkles className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Join the community</h2>
              <p className="mt-1.5 max-w-md text-sm text-white/70">
                Be first to get new drops, member-only deals and styling tips —
                straight to your inbox.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} noValidate aria-label="Join the community" className="w-full lg:w-auto">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="community-email" className="sr-only">
                Email address
              </label>
              <div className="relative sm:w-80">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/50" aria-hidden="true" />
                <input
                  id="community-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={error ? 'true' : undefined}
                  className={cn(
                    'h-12 w-full rounded-full border bg-white/10 pl-10 pr-4 text-sm text-white backdrop-blur',
                    'placeholder:text-white/45 focus-visible:focus-ring',
                    error ? 'border-danger' : 'border-white/15 hover:border-white/30',
                  )}
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:focus-ring"
                style={{ background: 'linear-gradient(90deg,#7C7FF5,#c084fc)' }}
              >
                {submitted ? (
                  <>
                    <Check className="size-4" aria-hidden="true" /> Subscribed
                  </>
                ) : (
                  <>
                    Subscribe <ArrowRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
            <p
              role="status"
              aria-live="polite"
              className={cn('mt-2 min-h-[1.1rem] text-xs', error ? 'text-danger' : 'text-white/55')}
            >
              {error || (submitted ? "You're in! Welcome to the community." : 'No spam — unsubscribe anytime.')}
            </p>
          </form>
        </div>
      </motion.div>
    </section>
  );
}
