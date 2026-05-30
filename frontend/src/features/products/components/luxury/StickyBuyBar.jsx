import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShoppingBag, Zap, Check } from 'lucide-react';
import { formatPrice } from '@/lib/utils.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import { ProductMedia } from '../ProductMedia.jsx';

/**
 * Persistent buy bar that slides in once the user scrolls past the hero, so
 * the primary actions are always one tap away. Anchored to the bottom of the
 * viewport (the natural thumb zone on mobile, and unobtrusive on desktop).
 */
export function StickyBuyBar({ product }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const addToCart = useAddToCart();
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    // Prefer to key the bar off the main buy panel: show it ONLY once that
    // panel has scrolled out of view, so the two never stack on screen.
    const anchor = document.getElementById('pdp-buybox');
    if (anchor && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        ([entry]) => {
          // Visible only when the buy panel is above the viewport (scrolled past).
          setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        },
        { threshold: 0 },
      );
      io.observe(anchor);
      return () => io.disconnect();
    }
    // Fallback: simple scroll threshold.
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > 620);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const outOfStock = product.stock <= 0;

  function addNext(action) {
    if (!user) {
      navigate(`/login?next=/products/${product.id}`);
      return;
    }
    action();
  }

  function handleAdd() {
    addNext(() =>
      addToCart.mutate(
        { productId: product.id, quantity: 1 },
        { onSuccess: () => setAdded(true) },
      ),
    );
  }

  function handleBuyNow() {
    const target = `/checkout?buyNow=${product.id}&qty=1`;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduce ? false : { y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: 100, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-4"
        >
          <div className="glass mx-auto flex max-w-content items-center gap-3 rounded-lg p-3 sm:gap-4 sm:p-4">
            <div className="hidden size-12 shrink-0 overflow-hidden rounded-md border border-line-subtle sm:block">
              <ProductMedia product={product} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-primary">
                {product.name}
              </p>
              <p className="text-sm text-ink-secondary tabular-nums">
                {formatPrice(product.price)}
              </p>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={outOfStock}
              className="hidden h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-bg-base/40 px-5 text-sm font-semibold text-ink-primary transition-colors hover:bg-fill focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-40 sm:inline-flex"
            >
              <Zap className="size-4 text-accent" aria-hidden="true" /> Buy Now
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={outOfStock || addToCart.isPending}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-ink-inverse shadow-glow transition-[transform,filter] hover:brightness-105 focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-40 sm:flex-none"
            >
              {added ? (
                <>
                  <Check className="size-4" aria-hidden="true" /> Added
                </>
              ) : outOfStock ? (
                'Out of stock'
              ) : (
                <>
                  <ShoppingBag className="size-4" aria-hidden="true" /> Add to Cart
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
