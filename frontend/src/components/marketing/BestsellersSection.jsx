import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/Button.jsx';
import { ProductGrid } from '@/features/products/components/ProductGrid.jsx';
import { useBestsellers } from '@/features/products/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { cn } from '@/lib/utils.js';

/**
 * Homepage "Bestsellers" rail — top sellers from paid/shipped/delivered orders.
 * The endpoint falls back to newest products when no qualifying orders exist,
 * so the rendering branch is binary: loading skeletons vs. cards. We do not
 * show an empty state because the server guarantees the list is non-empty.
 */
export default function BestsellersSection({ limit = 8 }) {
  const { data: products = [], isLoading } = useBestsellers(limit);
  const addToCart = useAddToCart();

  // Hide the section entirely if the catalog is genuinely empty (e.g. a fresh
  // install with zero products). Two adjacent empty sections look broken.
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mx-auto mt-20 max-w-content px-6">
      <header className="flex flex-col items-center text-center">
        <h2 className="text-h2 text-ink-primary">Bestsellers</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          What our customers love most this week.
        </p>
      </header>

      <div className="mt-8">
        <ProductGrid
          products={products}
          loading={isLoading}
          skeletonCount={limit}
          onQuickAdd={(p) => addToCart.mutate({ productId: p.id })}
        />
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to="/products"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          Shop all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
