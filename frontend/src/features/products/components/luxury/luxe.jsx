import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils.js';
import { ease, duration } from '@/lib/motion.js';

/**
 * Shared primitives for the luxury product page.
 *
 * Everything here is theme-aware (it speaks in design tokens, not hard-coded
 * colours) so the page reads as premium in BOTH light and dark mode. The soft
 * lavender "luxury" feel is layered as low-opacity gradients on top of the
 * token palette — the brand accent (#6366F1) already sits in that family.
 */

/**
 * Ambient lighting — soft, blurred colour fields behind the page content.
 * Rendered inside an `isolate` parent and pinned with `-z-10` so it floats
 * behind the cards without ever intercepting clicks. Subtle by design.
 */
export function Aura({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
        className,
      )}
    >
      <div className="absolute -left-40 -top-48 size-[620px] rounded-full bg-accent/25 blur-[130px]" />
      <div
        className="absolute -right-32 top-10 size-[560px] rounded-full blur-[130px]"
        style={{ background: 'rgba(183, 148, 244, 0.28)' }}
      />
      <div
        className="absolute left-1/4 top-[640px] size-[480px] rounded-full blur-[150px]"
        style={{ background: 'rgba(99, 102, 241, 0.16)' }}
      />
    </div>
  );
}

/**
 * Scroll reveal — fades + rises its children the first time they enter the
 * viewport. Collapses to a plain wrapper when the user prefers reduced motion.
 */
export function Reveal({ children, className, delay = 0, y = 24, as = 'div' }) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: duration.slow, ease: ease.entrance, delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Frosted-glass surface with the brand's 24px radius and soft depth. */
export function GlassCard({ children, className, ...props }) {
  return (
    <div className={cn('glass rounded-lg', className)} {...props}>
      {children}
    </div>
  );
}

/** Section heading with a small accent eyebrow — used between page sections. */
export function SectionHeading({ eyebrow, title, className }) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          <span className="h-px w-6 bg-accent/50" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-h2 text-ink-primary text-balance">{title}</h2>
    </div>
  );
}
