import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ease } from '@/lib/motion.js';

/**
 * Editorial lifestyle banner — a large, cinematic moment after the spec-heavy
 * sections. Uses the product's own primary image with a gradient scrim so the
 * brand copy stays legible in both themes. No data is invented: if the product
 * has no imagery the banner simply doesn't render.
 */
export function LifestyleBanner({ product }) {
  const reduce = useReducedMotion();
  const hero =
    product.image_url ||
    [...(product.images || [])].sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
    )[0]?.url;

  if (!hero) return null;

  return (
    <section className="mt-20">
      <div className="relative isolate overflow-hidden rounded-lg">
        <motion.img
          src={hero}
          alt=""
          aria-hidden="true"
          initial={reduce ? false : { scale: 1.12 }}
          whileInView={reduce ? undefined : { scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: ease.standard }}
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        {/* Scrim — darkens the image so type reads in any theme */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(110deg, rgba(10,10,18,0.82) 0%, rgba(20,16,40,0.6) 45%, rgba(99,102,241,0.25) 100%)',
          }}
        />
        <div className="flex min-h-[340px] flex-col justify-center gap-4 p-8 sm:min-h-[420px] sm:p-14">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: ease.entrance }}
            className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70"
          >
            {product.name}
          </motion.span>
          <motion.h2
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.08, ease: ease.entrance }}
            className="max-w-xl text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl"
          >
            Designed for modern life.
          </motion.h2>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.16, ease: ease.entrance }}
            className="flex flex-wrap gap-x-6 gap-y-2 text-lg font-medium text-white/85"
          >
            <span>Comfort.</span>
            <span>Style.</span>
            <span>Performance.</span>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.24, ease: ease.entrance }}
            className="mt-4"
          >
            <Link
              to="/products"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#171627] shadow-lg transition-transform hover:-translate-y-0.5 focus-visible:focus-ring"
            >
              Explore the collection
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
