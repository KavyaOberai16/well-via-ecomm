import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button.jsx';
import { cn } from '@/lib/utils.js';
import { duration, ease } from '@/lib/motion.js';

/**
 * Cinematic hero — layered radial glows + masked grid behind a glass content
 * panel. Headline / subcopy / CTAs stagger in. No image asset, GPU-cheap.
 */
export default function Hero() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 22 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, ease: ease.entrance },
    },
  };

  return (
    <section className="relative isolate overflow-hidden">
      {/* Background layers */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute -top-1/3 left-1/2 size-[680px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 size-[420px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />
        {/* Scrim so text contrast holds */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-base/40 via-transparent to-bg-base" />
      </div>

      <div className="mx-auto flex min-h-[88vh] max-w-content flex-col items-center justify-center px-6 py-24 text-center lg:min-h-[min(92vh,880px)]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          <motion.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-ink-secondary">
              <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
              New season — curated for 2026
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-6 max-w-3xl text-balance text-display text-ink-primary"
          >
            Shopping, refined to a feeling.
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-xl text-balance text-base text-ink-secondary"
          >
            A premium store built for speed and delight — discover products
            presented the way they deserve to be.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row"
          >
            <Link
              to="/products"
              className={cn(buttonVariants({ variant: 'primary', size: 'lg' }), 'w-full sm:w-auto')}
            >
              Explore the collection
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              to="/products"
              className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'w-full sm:w-auto')}
            >
              Browse new arrivals
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
