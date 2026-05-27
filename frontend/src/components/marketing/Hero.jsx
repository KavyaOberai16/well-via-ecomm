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
    <section
      className="relative isolate overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      {/* Background layers */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* Static gradient fallback — always rendered, visible when no slides */}
        <div className="absolute -top-1/3 left-1/2 size-[680px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 size-[420px] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute inset-0 [background-image:linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />

        {/* Crossfading slide images — rendered on top of gradient */}
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

        {/* Dark scrim over images for text readability */}
        {hasSlides && (
          <div className="absolute inset-0 bg-black/40" />
        )}

        {/* Original scrim — gradient fade */}
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

        {/* Slide indicator dots */}
        {hasSlides && slides.length > 1 && (
          <div
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2"
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
                    : 'size-2 bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
