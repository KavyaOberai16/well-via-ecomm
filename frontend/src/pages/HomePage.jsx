import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, Sparkles, PackageX } from 'lucide-react';
import Hero from '@/components/marketing/Hero.jsx';
import { Page } from '@/components/layout/Page.jsx';
import { ProductGrid } from '@/features/products/components/ProductGrid.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { buttonVariants } from '@/components/ui/Button.jsx';
import { useProducts } from '@/features/products/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { cn } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

const PERKS = [
  { icon: Truck, title: 'Free, fast delivery', text: 'On every order, every time.' },
  { icon: ShieldCheck, title: 'Secure checkout', text: 'Encrypted, private, effortless.' },
  { icon: Sparkles, title: 'Curated quality', text: 'Every product, hand-selected.' },
];

export default function HomePage() {
  const { data, isLoading } = useProducts({ page: 1, page_size: 8 });
  const addToCart = useAddToCart();
  const products = data?.items ?? [];

  return (
    <Page bleed>
      <Hero />

      <section className="mx-auto max-w-content px-6">
        {/* Perks band */}
        <motion.ul
          className="grid gap-4 sm:grid-cols-3"
          variants={staggerContainer(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
        >
          {PERKS.map((p) => (
            <motion.li
              key={p.title}
              variants={fadeUp}
              className="flex items-start gap-3 rounded-lg border border-line-subtle bg-bg-elevated p-5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-accent/15 text-accent">
                <p.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink-primary">{p.title}</h3>
                <p className="mt-0.5 text-sm text-ink-secondary">{p.text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        {/* Featured products */}
        <div className="mt-20">
          <header className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-h2 text-ink-primary">Featured</h2>
              <p className="mt-1 text-sm text-ink-secondary">Hand-picked for you this week.</p>
            </div>
            <Link
              to="/products"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              View all
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </header>

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
        </div>
      </section>
    </Page>
  );
}
