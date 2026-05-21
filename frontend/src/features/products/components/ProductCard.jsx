import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { cn, formatPrice, stockLabel } from '@/lib/utils.js';
import { Badge } from '@/components/ui/Badge.jsx';
import { fadeUp } from '@/lib/motion.js';
import { ProductMedia } from './ProductMedia.jsx';

/**
 * Animated product card — subtle pointer-driven 3D tilt (<= 6 deg), media zoom,
 * and a fade-in quick-add. Tilt is disabled under reduced-motion and is never
 * applied via keyboard focus.
 */
export function ProductCard({ product, onQuickAdd }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const spring = { stiffness: 150, damping: 18 };
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), spring);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), spring);

  const outOfStock = product.stock <= 0;
  const stock = stockLabel(product.stock);

  function handleMove(e) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function reset() {
    mx.set(0);
    my.set(0);
    setHovered(false);
  }

  function handleQuickAdd(e) {
    e.preventDefault();
    if (!outOfStock) onQuickAdd?.(product);
  }

  return (
    <motion.div variants={fadeUp} style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={reset}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group"
      >
        <Link
          to={`/products/${product.id}`}
          className={cn(
            'block overflow-hidden rounded-lg border border-line-subtle bg-bg-elevated shadow-md',
            'transition-shadow duration-200 hover:shadow-lg',
            'focus-visible:focus-ring',
          )}
        >
          {/* Media — fixed 4:5 aspect reserves space */}
          <div className="relative aspect-[4/5] overflow-hidden">
            <motion.div
              animate={{ scale: hovered && !reduce ? 1.05 : 1 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="size-full"
            >
              <ProductMedia
                product={product}
                className={cn(outOfStock && 'opacity-60 saturate-[0.4]')}
              />
            </motion.div>

            <div className="absolute left-3 top-3">
              <Badge tone={stock.tone}>{stock.text}</Badge>
            </div>

            {/* Quick add — fades in on hover, available to keyboard always */}
            <div
              className={cn(
                'absolute inset-x-3 bottom-3 transition-opacity duration-200',
                'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
              )}
            >
              <button
                type="button"
                onClick={handleQuickAdd}
                disabled={outOfStock}
                aria-label={`Add ${product.name} to cart`}
                className={cn(
                  'flex h-10 w-full items-center justify-center gap-2 rounded-sm',
                  'glass text-sm font-semibold text-ink-primary',
                  'transition-colors hover:border-line-strong',
                  'focus-visible:focus-ring',
                  'disabled:opacity-40 disabled:pointer-events-none',
                )}
              >
                <ShoppingBag className="size-4" aria-hidden="true" />
                {outOfStock ? 'Unavailable' : 'Quick add'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1 p-4">
            <p className="text-xs uppercase tracking-wide text-ink-tertiary">
              {product.sku}
            </p>
            <h3 className="line-clamp-2 text-sm font-semibold text-ink-primary">
              {product.name}
            </h3>
            <p className="mt-1 text-h3 text-ink-primary">
              {formatPrice(product.price)}
            </p>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
