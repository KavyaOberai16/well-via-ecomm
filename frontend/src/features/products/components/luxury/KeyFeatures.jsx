import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Zap, ShieldCheck, Package, Award, Leaf } from 'lucide-react';
import { staggerContainer, fadeUp } from '@/lib/motion.js';
import { GlassCard, SectionHeading } from './luxe.jsx';

const ICONS = [Sparkles, Zap, ShieldCheck, Package, Award, Leaf];

/**
 * "Highlights" — icon feature cards.
 *
 * There's no structured key-features field on Product, so rather than invent
 * specs (battery life, ANC…) we surface the product's OWN description, split
 * into its strongest short sentences. Honest by construction: every word here
 * was written for this product. The section hides itself when the description
 * yields fewer than two usable highlights.
 */
export function KeyFeatures({ product }) {
  const reduce = useReducedMotion();
  const highlights = extractHighlights(product.description);
  if (highlights.length < 2) return null;

  return (
    <section aria-labelledby="highlights-heading" className="mt-20">
      <SectionHeading
        eyebrow="Why you'll love it"
        title="Highlights"
        className="items-start"
      />
      <p className="sr-only" id="highlights-heading">
        Product highlights
      </p>

      <motion.ul
        className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={reduce ? undefined : staggerContainer(0.08)}
        initial={reduce ? false : 'hidden'}
        whileInView={reduce ? undefined : 'show'}
        viewport={{ once: true, margin: '-80px' }}
      >
        {highlights.map((text, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <motion.li key={i} variants={reduce ? undefined : fadeUp}>
              <GlassCard className="h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="grid size-11 place-items-center rounded-md bg-accent/12 text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{text}</p>
              </GlassCard>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}

/** Split the description into up to four punchy, distinct highlight lines. */
function extractHighlights(description) {
  const raw = (description || '').trim();
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(/(?<=[.!?])\s+|\n+/g)
        .map((s) => s.trim().replace(/\s+/g, ' '))
        .filter((s) => s.length >= 12 && s.length <= 140),
    ),
  ].slice(0, 4);
}
