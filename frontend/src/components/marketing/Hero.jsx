import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Flame } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button.jsx';
import { cn } from '@/lib/utils.js';
import { duration, ease } from '@/lib/motion.js';
import { useHeroSlides } from '@/features/hero-slides/hooks.js';
import { useBestsellers } from '@/features/products/hooks.js';
import { DEFAULT_PERKS, resolvePerkIcon } from '@/features/hero-slides/perks.js';
import { SaleCountdown, useSaleTarget } from './SaleCountdown.jsx';

const INTERVAL_MS = 5000;

// --- Slide renderers ---

function SaleSlide({ slide, fallbackImage }) {
  const reduce = useReducedMotion();
  const saleTarget = useSaleTarget();

  const heading = slide.heading ?? 'Shopping, refined to a feeling.';
  const subtext =
    slide.subtext ??
    'A premium store built for speed and delight. Curated essentials, fair prices, and a checkout that just works.';
  const ctaLabel = slide.cta_label ?? 'Shop the collection';
  const ctaHref = slide.cta_href ?? '/products';

  // Convention for these fields: null/undefined → built-in default;
  // explicit empty string / empty array → hidden.
  const eyebrow = slide.eyebrow == null ? 'Mega season sale is live' : slide.eyebrow;

  const cta2Label = slide.cta2_label == null ? 'Browse new arrivals' : slide.cta2_label;
  const cta2Href = slide.cta2_href || '/products?sort=newest';

  const perks = slide.perks == null ? DEFAULT_PERKS : slide.perks;

  const countdownLabel =
    slide.countdown_label == null
      ? slide._isFallback
        ? 'Mega season sale ends in'
        : 'Sale ends in'
      : slide.countdown_label;

  const image = slide.image_url || fallbackImage;
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = image && !imgFailed;

  // countdown_end: only render if set and still in the future
  const countdownTarget = (() => {
    if (!slide.countdown_end) return null;
    const ms = Date.parse(slide.countdown_end);
    if (!Number.isFinite(ms) || ms <= Date.now()) return null;
    return ms;
  })();
  // fallback slide has no countdown_end → use saleTarget
  const effectiveCountdown = countdownTarget ?? (slide._isFallback ? saleTarget : null);

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.05 },
    },
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
    <div className="grid items-center gap-8 px-6 py-12 sm:px-10 sm:py-14 lg:grid-cols-2 lg:gap-6 lg:py-16 lg:pl-14">
      {/* Left — copy */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex flex-col items-start"
      >
        {eyebrow && (
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-line-subtle bg-fill px-4 py-1.5 text-xs font-medium text-ink-secondary"
          >
            <Flame className="size-3.5 text-accent" aria-hidden="true" />
            {eyebrow}
          </motion.span>
        )}

        <motion.h1
          variants={item}
          className="mt-5 max-w-xl text-balance text-display text-ink-primary"
        >
          {heading}
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-4 max-w-prose text-balance text-body text-ink-secondary"
        >
          {subtext}
        </motion.p>

        <motion.div
          variants={item}
          className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center"
        >
          <Link
            to={ctaHref}
            className={cn(
              buttonVariants({ variant: 'primary', size: 'lg' }),
              'w-full rounded-full sm:w-auto',
            )}
          >
            {ctaLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          {cta2Label && (
            <Link
              to={cta2Href}
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'lg' }),
                'w-full rounded-full sm:w-auto',
              )}
            >
              {cta2Label}
            </Link>
          )}
        </motion.div>

        {perks.length > 0 && (
          <motion.ul variants={item} className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {perks.map(({ icon, label }, i) => {
              const Icon = resolvePerkIcon(icon);
              return (
                <li
                  key={`${label}-${i}`}
                  className="inline-flex items-center gap-2 text-sm text-ink-secondary"
                >
                  <Icon className="size-4 text-accent" aria-hidden="true" />
                  {label}
                </li>
              );
            })}
          </motion.ul>
        )}
      </motion.div>

      {/* Right — product showcase */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: duration.slow, ease: ease.entrance, delay: 0.15 }}
        className="relative mx-auto w-full max-w-md lg:max-w-none"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          {/* Pedestal */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 25%, rgba(124,127,245,0.30) 0%, rgba(236,72,153,0.16) 42%, transparent 72%)',
            }}
          />
          <div
            className="absolute inset-x-[16%] bottom-[14%] h-12 rounded-[100%] bg-accent/20 blur-2xl"
            aria-hidden="true"
          />

          {showImage ? (
            <motion.img
              src={image}
              alt={slide.alt || ''}
              onError={() => setImgFailed(true)}
              className="absolute inset-0 size-full object-contain p-10 drop-shadow-[0_28px_44px_rgba(0,0,0,0.30)]"
              animate={reduce ? undefined : { y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          ) : (
            <div className="absolute inset-10 grid place-items-center rounded-full bg-gradient-to-br from-accent/30 to-fuchsia-400/20 text-6xl font-bold text-accent/60">
              ✦
            </div>
          )}

          {/* Sale badge — only if badge_text is set, or this is the fallback slide */}
          {(slide.badge_text || slide._isFallback) && (
            <div
              className="absolute right-3 top-3 grid size-24 place-items-center rounded-full text-center text-white shadow-lg sm:size-28"
              style={{ background: 'linear-gradient(135deg,#f0903a,#ec4899)' }}
            >
              <div>
                {slide.badge_text ? (
                  <p className="px-1 text-[11px] font-extrabold uppercase leading-tight tracking-wide">
                    {slide.badge_text}
                  </p>
                ) : (
                  <>
                    <p className="text-[9px] font-semibold uppercase tracking-wide opacity-90">
                      Up to
                    </p>
                    <p className="text-2xl font-extrabold leading-none sm:text-3xl">60%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide">Off</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Countdown */}
        {effectiveCountdown && (
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            {countdownLabel && (
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">
                {countdownLabel}
              </span>
            )}
            <SaleCountdown target={effectiveCountdown} />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function PhotoSlide({ slide }) {
  const isLight = (slide.text_theme ?? 'light') === 'light';
  const hasOverlay = !!(slide.heading || slide.cta_label);
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = slide.image_url && !imgFailed;

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ minHeight: '420px' }}
    >
      {showImage ? (
        <img
          src={slide.image_url}
          alt={slide.alt || ''}
          onError={() => setImgFailed(true)}
          className="absolute inset-0 size-full object-cover"
          style={{ minHeight: '420px' }}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-accent/25 via-bg-elevated to-fuchsia-400/15">
          <span className="text-sm text-ink-tertiary">Image unavailable</span>
        </div>
      )}

      {hasOverlay && (
        <>
          {/* Scrim */}
          <div
            aria-hidden="true"
            className={cn(
              'absolute inset-0',
              isLight
                ? 'bg-gradient-to-t from-black/60 via-black/20 to-transparent'
                : 'bg-gradient-to-t from-white/70 via-white/30 to-transparent',
            )}
          />
          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 flex flex-col items-start gap-4 px-6 pb-8 sm:px-10 sm:pb-10">
            {slide.heading && (
              <h1
                className={cn(
                  'max-w-lg text-balance text-display',
                  isLight ? 'text-white drop-shadow-sm' : 'text-ink-primary',
                )}
              >
                {slide.heading}
              </h1>
            )}
            {slide.cta_label && slide.cta_href && (
              <Link
                to={slide.cta_href}
                className={cn(
                  buttonVariants({ variant: isLight ? 'primary' : 'secondary', size: 'lg' }),
                  'rounded-full',
                )}
              >
                {slide.cta_label}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// --- Carousel controls ---

function Dots({ count, active, onGo }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3" role="tablist" aria-label="Slide indicators">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={i === active}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onGo(i)}
          className={cn(
            'h-2 rounded-full transition-all duration-300 focus-visible:focus-ring',
            i === active
              ? 'w-6 bg-accent'
              : 'w-2 bg-ink-tertiary/40 hover:bg-ink-tertiary/70',
          )}
        />
      ))}
    </div>
  );
}

function NavArrow({ direction, onClick, disabled }) {
  const Icon = direction === 'prev' ? ArrowLeft : ArrowRight;
  const label = direction === 'prev' ? 'Previous slide' : 'Next slide';
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 z-10 -translate-y-1/2',
        direction === 'prev' ? 'left-3' : 'right-3',
        'grid size-9 place-items-center rounded-full',
        'bg-bg-elevated/80 text-ink-primary shadow backdrop-blur',
        'border border-line-subtle',
        'transition-opacity hover:opacity-100',
        'focus-visible:focus-ring',
        'disabled:pointer-events-none disabled:opacity-30',
        'opacity-70',
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

// --- Main Hero ---

export default function Hero() {
  const reduce = useReducedMotion();
  const { data: slides = [] } = useHeroSlides();
  const { data: bestsellers = [] } = useBestsellers(4);
  // useSaleTarget is called for the fallback slide — its value is consumed inside SaleSlide
  // when slide._isFallback is true. We pass it as part of the synthetic slide object.
  const saleTarget = useSaleTarget();

  // Build the effective slide list. If no active slides → single synthetic fallback.
  const effectiveSlides = slides.length > 0
    ? slides
    : [
        {
          id: '__fallback__',
          kind: 'sale',
          _isFallback: true,
          image_url: bestsellers[0]?.image_url ?? null,
          alt: '',
          heading: null,
          subtext: null,
          badge_text: null,       // fallback uses hard-coded "UP TO 60% OFF" layout
          cta_label: null,
          cta_href: null,
          countdown_end: null,    // fallback uses saleTarget from useSaleTarget()
          text_theme: 'light',
        },
      ];

  const total = effectiveSlides.length;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback(
    (index) => {
      const next = (index + total) % total;
      setCurrent(next);
    },
    [total],
  );

  const goPrev = useCallback(() => goTo(current - 1), [goTo, current]);
  const goNext = useCallback(() => goTo(current + 1), [goTo, current]);

  // Auto-advance
  useEffect(() => {
    if (reduce || paused || total <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [reduce, paused, total]);

  // When user navigates manually, reset the timer by toggling paused briefly
  // (we just restart by clearing the effect dependency on `current` isn't clean;
  // instead we use a dedicated restartKey approach below).
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {
    if (reduce || paused || total <= 1) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, INTERVAL_MS);
    return () => clearInterval(timerRef.current);
    // restartKey changes when user manually navigates, forcing timer reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, paused, total, restartKey]);

  function handleGoTo(i) {
    goTo(i);
    setRestartKey((k) => k + 1);
  }

  function handlePrev() {
    goPrev();
    setRestartKey((k) => k + 1);
  }

  function handleNext() {
    goNext();
    setRestartKey((k) => k + 1);
  }

  const currentSlide = effectiveSlides[current] ?? effectiveSlides[0];
  const fallbackImage = bestsellers[0]?.image_url ?? null;

  return (
    <section
      className="mx-auto mt-6 max-w-content px-4 sm:px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative isolate overflow-hidden rounded-lg border border-line-subtle bg-bg-elevated">
        {/* Background wash (only for sale slides / when no full-bleed image is present) */}
        {(currentSlide.kind !== 'photo' || !currentSlide.image_url) && (
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <div className="absolute -left-16 -top-16 size-72 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-500/15" />
            <div className="absolute -right-16 top-1/3 size-80 rounded-full bg-fuchsia-300/25 blur-3xl dark:bg-fuchsia-500/12" />
            <div className="absolute -bottom-16 left-1/3 size-64 rounded-full bg-pink-200/30 blur-3xl dark:bg-pink-500/10" />
            <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(99,102,241,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
          </div>
        )}

        {/* Slides — crossfade via AnimatePresence */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.base, ease: ease.standard }}
          >
            {(currentSlide.kind === 'sale' || currentSlide._isFallback) ? (
              <SaleSlide slide={currentSlide} fallbackImage={fallbackImage} />
            ) : (
              <PhotoSlide slide={currentSlide} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next arrows (>1 slides) */}
        {total > 1 && (
          <>
            <NavArrow direction="prev" onClick={handlePrev} />
            <NavArrow direction="next" onClick={handleNext} />
          </>
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <Dots count={total} active={current} onGo={handleGoTo} />
      )}
    </section>
  );
}
