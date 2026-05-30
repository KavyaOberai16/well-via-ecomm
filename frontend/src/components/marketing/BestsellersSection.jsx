import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button.jsx';
import { ProductGrid } from '@/features/products/components/ProductGrid.jsx';
import { useBestsellers } from '@/features/products/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { cn } from '@/lib/utils.js';
import { fadeUp } from '@/lib/motion.js';

/**
 * Homepage "Bestsellers" rail — top sellers from paid/shipped/delivered orders.
 * Falls back to newest products when no qualifying orders exist.
 */
export default function BestsellersSection({ limit = 8 }) {
  const { data: products = [], isLoading } = useBestsellers(limit);
  const addToCart = useAddToCart();

  // Hide if catalog is empty — two adjacent empty sections look broken.
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mx-auto mt-20 max-w-content px-4 sm:px-6">
      <motion.header
        className="flex items-end justify-between gap-4"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
      >
        <div>
          <h2 className="text-h2 text-ink-primary">Bestsellers</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Loved by our customers.
          </p>
        </div>
        <Link
          to="/products?sort=bestsellers"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0')}
        >
          View all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </motion.header>

      <div className="mt-8">
        <ProductGrid
          products={products}
          loading={isLoading}
          skeletonCount={limit}
          onQuickAdd={(p) => addToCart.mutate({ productId: p.id })}
        />
      </div>
    </section>
  );
}
