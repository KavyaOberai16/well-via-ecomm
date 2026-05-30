import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button.jsx';
import { cn } from '@/lib/utils.js';
import { duration, ease } from '@/lib/motion.js';
import { useHeroSlides } from '@/features/hero-slides/hooks.js';

const ROTATE_MS = 5000;

function SlideImage({ slide, priority }) {
  return (
    <motion.img
      src={slide.image_url}
      alt={slide.alt || ''}
      loading={priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      className="absolute inset-0 size-full object-cover"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: duration.slow, ease: ease.standard }}
      aria-hidden="true"
    />
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const { data: slides = [] } = useHeroSlides();
  const hasSlides = slides.length > 0;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback(
    (i) => {
      setIndex(i);
      clearInterval(timerRef.current);
      if (!reduce && hasSlides) {
        timerRef.current = setInterval(
          () => setIndex((prev) => (prev + 1) % slides.length),
          ROTATE_MS,
        );
      }
    },
    [reduce, hasSlides, slides.length],
  );

  useEffect(() => {
    if (reduce || !hasSlides || paused) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(
      () => setIndex((prev) => (prev + 1) % slides.length),
      ROTATE_MS,
    );
    return () => clearInterval(timerRef.current);
  }, [reduce, hasSlides, slides.length, paused]);

  useEffect(() => {
    if (index >= slides.length && slides.length > 0) setIndex(0);
  }, [slides.length, index]);

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

  const activeSlide = slides[index] ?? null;

  return (
    <section className="mx-auto mt-6 max-w-content px-4 sm:px-6">
      {/* Contained hero panel */}
      <div
        className="relative isolate overflow-hidden rounded-lg border border-line-subtle"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
        }}
      >
        {/* Background layer */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          {/* Base surface */}
          <div className="absolute inset-0 bg-bg-elevated" />

          {/* Decorative gradient blobs — soft brand tints, good on both themes */}
          <div className="absolute -top-16 -left-16 size-72 rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-500/15" />
          <div className="absolute top-1/2 -right-20 size-80 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/12" />
          <div className="absolute -bottom-12 left-1/3 size-64 rounded-full bg-pink-200/30 blur-3xl dark:bg-pink-500/10" />

          {/* Subtle dot-grid texture */}
          <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(99,102,241,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />

          {/* Crossfading slide images when admin slides exist */}
          {hasSlides && (
            <AnimatePresence mode="sync">
              {activeSlide && (
                <SlideImage
                  key={activeSlide.id}
                  slide={activeSlide}
                  priority={index === 0}
                />
              )}
            </AnimatePresence>
          )}

          {/* Light scrim over images so dark text stays readable */}
          {hasSlides && (
            <div className="absolute inset-0 bg-bg-elevated/65" />
          )}
        </div>

        {/* Content — two-column on lg */}
        <div className="relative flex min-h-[420px] flex-col justify-center px-8 py-14 sm:px-12 sm:py-16 lg:min-h-[480px] lg:max-w-[62%] lg:py-20 lg:pl-14 lg:pr-0">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start"
          >
            {/* Badge pill */}
            <motion.div variants={item}>
              <span className="inline-flex items-center gap-2 rounded-full border border-line-subtle bg-fill px-4 py-1.5 text-xs font-medium text-ink-secondary">
                <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
                New season — curated for 2026
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={item}
              className="mt-5 max-w-xl text-balance text-display text-ink-primary"
            >
              Shopping, refined to a feeling.
            </motion.h1>

            {/* Supporting copy */}
            <motion.p
              variants={item}
              className="mt-4 max-w-prose text-balance text-body text-ink-secondary"
            >
              A premium store built for speed and delight. Curated essentials,
              fair prices, and a checkout that just works.
            </motion.p>

            {/* CTA row */}
            <motion.div
              variants={item}
              className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
            >
              <Link
                to="/products"
                className={cn(
                  buttonVariants({ variant: 'primary', size: 'lg' }),
                  'rounded-full w-full sm:w-auto',
                )}
              >
                Explore the collection
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/products?sort=newest"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'lg' }),
                  'w-full sm:w-auto text-ink-secondary hover:text-ink-primary',
                )}
              >
                Browse new arrivals
                <ArrowRight className="size-3.5 opacity-60" aria-hidden="true" />
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Right decorative area — CSS-only blobs, visible when no slide image */}
        {!hasSlides && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] lg:block"
          >
            <div className="absolute right-12 top-1/2 size-40 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-200 to-violet-200 opacity-60 blur-md dark:from-indigo-700/40 dark:to-violet-700/30" />
            <div className="absolute right-28 top-1/4 size-20 rounded-full bg-gradient-to-br from-pink-200 to-rose-200 opacity-50 blur-sm dark:from-pink-700/30 dark:to-rose-700/20" />
            <div className="absolute right-8 bottom-12 size-24 rounded-full bg-gradient-to-br from-sky-200 to-indigo-200 opacity-40 blur-sm dark:from-sky-700/30 dark:to-indigo-700/20" />
          </div>
        )}

        {/* Slide indicator dots — only when multiple slides exist */}
        {hasSlides && slides.length > 1 && (
          <div
            className="absolute bottom-6 right-8 flex items-center gap-2"
            role="tablist"
            aria-label="Hero slides"
          >
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => goTo(i)}
                className={cn(
                  'rounded-full transition-all duration-300 focus-visible:focus-ring',
                  i === index
                    ? 'h-2 w-6 bg-accent'
                    : 'size-2 bg-ink-tertiary/50 hover:bg-ink-tertiary/80',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
