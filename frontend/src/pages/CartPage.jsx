import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Trash2, ArrowRight, Lock, AlertTriangle } from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useCart, useRemoveFromCart } from '@/features/cart/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import { formatPrice } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

export default function CartPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = useCart();
  const removeItem = useRemoveFromCart();

  const items = data?.items ?? [];
  const subtotal = data?.subtotal ?? 0;
  const status = error?.response?.status;

  // Not signed in (or the session expired) — prompt to sign in.
  if (!user || status === 401) {
    return (
      <Page>
        <h1 className="text-h1 text-ink-primary">Your cart</h1>
        <div className="mt-6">
          <EmptyState
            icon={Lock}
            title="Sign in to view your cart"
            description="Your cart is saved to your account so it's here wherever you shop."
            action={
              <Link to="/login">
                <Button size="sm">Sign in</Button>
              </Link>
            }
          />
        </div>
      </Page>
    );
  }

  // Signed in, but the cart failed to load — a server error, not an auth issue.
  if (isError) {
    return (
      <Page>
        <h1 className="text-h1 text-ink-primary">Your cart</h1>
        <div className="mt-6">
          <EmptyState
            icon={AlertTriangle}
            title="We couldn't load your cart"
            description="Something went wrong on our end. Please try again."
            action={
              <Button size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <h1 className="text-h1 text-ink-primary">Your cart</h1>

      {isLoading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Browse the collection and add something you love."
            action={
              <Link to="/products">
                <Button size="sm">
                  Browse products
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Line items */}
          <motion.ul
            className="flex flex-col gap-3"
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="show"
          >
            {items.map((item) => (
              <motion.li key={item.product_id} variants={fadeUp}>
                <Card className="flex items-center gap-4 p-4">
                  <div className="grid size-16 shrink-0 place-items-center rounded-sm bg-gradient-to-br from-accent/25 via-bg-elevated to-bg-sunken text-xl font-semibold text-ink-primary/30">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-ink-primary">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-ink-secondary">
                      {formatPrice(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-primary">
                    {formatPrice(item.line_total)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name} from cart`}
                    onClick={() => removeItem.mutate(item.product_id)}
                    className="grid size-9 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Card>
              </motion.li>
            ))}
          </motion.ul>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <h2 className="text-h3 text-ink-primary">Order summary</h2>
              <dl className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-ink-secondary">
                  <dt>Subtotal</dt>
                  <dd className="text-ink-primary">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-ink-secondary">
                  <dt>Delivery</dt>
                  <dd className="text-success">Free</dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-between border-t border-line-subtle pt-4">
                <span className="text-sm text-ink-secondary">Total</span>
                <span className="text-h3 text-ink-primary">{formatPrice(subtotal)}</span>
              </div>
              <Button block size="lg" className="mt-5">
                Proceed to checkout
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-tertiary">
                <Lock className="size-3" aria-hidden="true" />
                Secure, encrypted payment
              </p>
            </Card>
          </div>
        </div>
      )}
    </Page>
  );
}
