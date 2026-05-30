import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Flame } from 'lucide-react';
import { SaleCountdown, useSaleTarget } from './SaleCountdown.jsx';

/**
 * "Biggest Sale of the Season" promo banner — a dark gradient band with a big
 * discount, a live countdown, and a CTA into the catalog. Sits between the
 * category circles and the bestsellers rail.
 */
export default function DealsBanner() {
  const reduce = useReducedMotion();
  const target = useSaleTarget();

  return (
    <section className="mx-auto mt-16 max-w-content px-4 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="relative isolate overflow-hidden rounded-lg border border-white/10 p-7 text-white sm:p-9"
        style={{ background: 'linear-gradient(110deg,#2a2150 0%,#4a2f86 50%,#7c3aed 100%)' }}
      >
        {/* glow accents */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-1/4 size-56 rounded-full bg-indigo-400/25 blur-3xl" />

        <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              <Flame className="size-3.5" aria-hidden="true" /> Limited time
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Biggest Sale of the Season
            </h2>
            <p className="mt-1.5 text-sm text-white/75">
              Up to <strong className="text-white">60% off</strong> across audio,
              wearables and more. Don&apos;t miss out.
            </p>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <SaleCountdown target={target} tone="light" />
            <Link
              to="/products"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#3a1d7a] shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:focus-ring"
            >
              Shop all deals
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
