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
const topImage = "/sleeping.png";
const middleImage = "/working.png";
const bottomImage = "/meditation.png";

const INTERVAL_MS = 5000;


 function WellnessImg() {

 const [rotation, setRotation] = useState(0);
 const images = [
  { src: topImage},
  { src: middleImage},
  { src: bottomImage },
];
const positions = [
  { x: 120, y: 0, scale: 0.85 },     
  { x: 0, y: 100, scale: 1.3 },     
  { x: 120, y: 200, scale: 0.85 },   
];


useEffect(() => {
  const timer = setInterval(() => {
    setRotation((prev) => prev - 120);
  }, 3000);

  return () => clearInterval(timer);
}, []);

  return (
    <section className="mx-auto max-w-content px-4 py-8">
      <div className="grid grid-cols-2 items-center gap-4">

        {/* LEFT SIDE */}
        <div>
          <h1 className="text-2xl font-bold amita-font">
            Bites of Daily Wellness
          </h1>

          <h2 className="mt-3 text-lg font-semibold alata-font">
            Fuel your hustle
          </h2>

          <p className="mt-3 text-sm alata-font">
            Clean, functional nutrients shaped to fit
            seamlessly into your active morning ritual.
          </p>

          <button
            className="mt-4 rounded-full bg-[#133F30] px-5 py-2 text-sm text-white alata-font"
          >
            Shop Now!
          </button>
        </div>

        {/* RIGHT SIDE */}
            <div className="relative w-72 h-80">
  {images.map((img, index) => {
    
   const currentIndex =
  ((((rotation / 120) % 3) + index) % 3 + 3) % 3;

//const nextIndex = (currentIndex + 1) % 3;

const current = positions[currentIndex];
//const next = positions[nextIndex];

// const curvePoints = [
//   { x: 70, y: 40 },
//   { x: 70, y: 170 },
//   { x: 170, y: 100 },
// ];

// const curve = curvePoints[currentIndex];

    return (
      <motion.img
        key={index}
        src={img.src}
        alt=""
       animate={{
  x: current.x,
  y: current.y,
  scale: current.scale,
}}
transition={{
  duration: 0.8,
  ease: "easeInOut",
}}
        style={{
  zIndex: current.scale>1 ? 10 : 1,
}}
        className="absolute w-28 h-24 rounded-3xl object-cover shadow-lg"
      />
    );
  })}
</div>
      </div>
    </section>
  );
}
// --- Slide renderers ---

// function SaleSlide({ slide, fallbackImage }) {
//   const reduce = useReducedMotion();
//   const saleTarget = useSaleTarget();

//   const heading = slide.heading ?? 'Shopping, refined to a feeling.';
//   const subtext =
//     slide.subtext ??
//     'A premium store built for speed and delight. Curated essentials, fair prices, and a checkout that just works.';
//   const ctaLabel = slide.cta_label ?? 'Shop the collection';
//   const ctaHref = slide.cta_href ?? '/products';

//   // Convention for these fields: null/undefined → built-in default;
//   // explicit empty string / empty array → hidden.
//   const eyebrow = slide.eyebrow == null ? 'Mega season sale is live' : slide.eyebrow;

//   const cta2Label = slide.cta2_label == null ? 'Browse new arrivals' : slide.cta2_label;
//   const cta2Href = slide.cta2_href || '/products?sort=newest';

//   const perks = slide.perks == null ? DEFAULT_PERKS : slide.perks;

//   const countdownLabel =
//     slide.countdown_label == null
//       ? slide._isFallback
//         ? 'Mega season sale ends in'
//         : 'Sale ends in'
//       : slide.countdown_label;

//   const image = slide.image_url || fallbackImage;
//   const [imgFailed, setImgFailed] = useState(false);
//   const showImage = image && !imgFailed;

//   // countdown_end: only render if set and still in the future
//   const countdownTarget = (() => {
//     if (!slide.countdown_end) return null;
//     const ms = Date.parse(slide.countdown_end);
//     if (!Number.isFinite(ms) || ms <= Date.now()) return null;
//     return ms;
//   })();
//   // fallback slide has no countdown_end → use saleTarget
//   const effectiveCountdown = countdownTarget ?? (slide._isFallback ? saleTarget : null);

//   const container = {
//     hidden: {},
//     show: {
//       transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: 0.05 },
//     },
//   };
//   const item = {
//     hidden: { opacity: 0, y: 22 },
//     show: {
//       opacity: 1,
//       y: 0,
//       transition: { duration: duration.slow, ease: ease.entrance },
//     },
//   };

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
       <WellnessImg />
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
