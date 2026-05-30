import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Sparkles, PackageX } from 'lucide-react';
import Hero from '@/components/marketing/Hero.jsx';
import CategoryCircles from '@/components/marketing/CategoryCircles.jsx';
import BestsellersSection from '@/components/marketing/BestsellersSection.jsx';
import { Page } from '@/components/layout/Page.jsx';
import { ProductGrid } from '@/features/products/components/ProductGrid.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { buttonVariants } from '@/components/ui/Button.jsx';
import { useProducts } from '@/features/products/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { cn } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

const PERKS = [
  {
    icon: Truck,
    title: 'Free delivery',
    text: 'On every order',
  },
  {
    icon: ShieldCheck,
    title: 'Secure checkout',
    text: 'Encrypted & private',
  },
  {
    icon: Sparkles,
    title: 'Curated quality',
    text: 'Hand-selected',
  },
];

export default function HomePage() {
  const { data, isLoading } = useProducts({ page: 1, page_size: 8 });
  const addToCart = useAddToCart();
  const products = data?.items ?? [];

  return (
    <Page bleed>
      {/* A) Hero — contained, light, illustrated panel */}
      <Hero />

      {/* B) Curated for You — category circles */}
      <CategoryCircles />

      {/* C) Bestsellers */}
      <BestsellersSection />

      {/* E) Trust strip — slim bordered bar between Bestsellers and Featured */}
      <div className="mx-auto mt-16 max-w-content px-4 sm:px-6">
        <motion.ul
          className="flex flex-col divide-y divide-line-subtle overflow-hidden rounded-lg border border-line-subtle sm:flex-row sm:divide-x sm:divide-y-0"
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          role="list"
        >
          {PERKS.map((p) => (
            <motion.li
              key={p.title}
              variants={fadeUp}
              className="flex flex-1 items-center gap-3 bg-bg-elevated px-5 py-4"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-accent/10 text-accent">
                <p.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-primary">{p.title}</p>
                <p className="text-xs text-ink-secondary">{p.text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>

      {/* F) Featured grid */}
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

        <div className="mt-8 pb-16">
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
    </Page>
  );
}
