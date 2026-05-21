/** Motion tokens — mirror design-system.md §4. */

export const ease = {
  standard: [0.22, 1, 0.36, 1],
  entrance: [0.16, 1, 0.3, 1],
};

export const duration = {
  instant: 0.12,
  fast: 0.2,
  base: 0.32,
  slow: 0.5,
};

/** Fade + rise — the default reveal. */
export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.entrance },
  },
};

/** Stagger container — children reveal in sequence, capped so nothing drags. */
export const staggerContainer = (stagger = 0.07) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
});

/** Page entrance — used by the Page wrapper. */
export const pageEnter = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.standard },
  },
};
