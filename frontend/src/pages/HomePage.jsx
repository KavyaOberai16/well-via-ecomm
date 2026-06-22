import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PackageX } from 'lucide-react';
import Hero from '@/components/marketing/Hero.jsx';
import CategoryCircles from '@/components/marketing/CategoryCircles.jsx';
import DealsBanner from '@/components/marketing/DealsBanner.jsx';
import BestsellersSection from '@/components/marketing/BestsellersSection.jsx';
import CommunityBand from '@/components/marketing/CommunityBand.jsx';
import { Page } from '@/components/layout/Page.jsx';
import { ProductGrid } from '@/features/products/components/ProductGrid.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { buttonVariants } from '@/components/ui/Button.jsx';
import { useProducts } from '@/features/products/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { cn } from '@/lib/utils.js';
import { fadeUp } from '@/lib/motion.js';

export default function HomePage() {
  const { data, isLoading } = useProducts({ page: 1, page_size: 8 });
  const addToCart = useAddToCart();
  const products = data?.items ?? [];

  return (
    <Page bleed>
      {/* A) Hero — product showcase + mega-sale countdown */}
      <Hero />

      {/* B) Curated for You — category circles */}
      <CategoryCircles />

      {/* C) Biggest sale promo banner */}
      <DealsBanner />

      {/* D) Bestsellers */}
      <BestsellersSection />

      {/* E) Featured grid */}
      <section className="mx-auto mt-16 max-w-content px-4 sm:px-6">
        <motion.header
          className="flex items-end justify-between gap-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.5 }}
        >
          <div>
            <h2 className="text-h2 text-ink-primary">Featured</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Hand-picked for you this week.
            </p>
          </div>
          <Link
            to="/products"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'shrink-0')}
          >
            View all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </motion.header>

        <div className="mt-8">
          {!isLoading && products.length === 0 ? (
            <EmptyState
              icon={PackageX}
              title="No products yet"
              description="The catalog is being stocked. Check back shortly."
              action={
                <Link to="/products" className={cn(buttonVariants({ size: 'sm' }))}>
                  Browse the shop
                </Link>
              }
            />
          ) : (
            <ProductGrid
              products={products}
              loading={isLoading}
              onQuickAdd={(p) => addToCart.mutate({ productId: p.id })}
            />
          )}
        </div>
      </section>

      {/* F) Join the community */}
      <CommunityBand />
    </Page>
  );
}
