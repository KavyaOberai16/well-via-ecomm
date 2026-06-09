import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, ArrowRight, Lock, AlertTriangle, Check } from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import {
  useWishlist,
  useRemoveFromWishlist,
} from '@/features/wishlist/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import { formatPrice } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

function WishlistItem({ item }) {
  const remove = useRemoveFromWishlist();
  const add = useAddToCart();
  const added = add.isSuccess && add.variables?.productId === item.product_id;

  function handleMoveToCart() {
    add.mutate(
      { productId: item.product_id, quantity: 1 },
      {
        onSuccess: () => {
          // Remove from wishlist once it's safely in the cart — keeps the list
          // focused on what the user is still considering.
          remove.mutate(item.product_id);
        },
      },
    );
  }

  return (
    <motion.li variants={fadeUp}>
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <Link
          to={`/products/${item.product_id}`}
          className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-sm bg-gradient-to-br from-accent/25 via-bg-elevated to-bg-sunken focus-visible:focus-ring"
        >
          {item.image_url ? (
            <img
              src={item.image_url}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-xl font-semibold text-ink-primary/30">
              {(item.name || '?').charAt(0).toUpperCase()}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/products/${item.product_id}`}
            className="text-sm font-semibold text-ink-primary hover:text-accent focus-visible:focus-ring"
          >
            {item.name}
          </Link>
          <p className="mt-1 text-h3 text-ink-primary tabular-nums">
            {formatPrice(item.price)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleMoveToCart}
            loading={add.isPending}
            disabled={remove.isPending || added}
          >
            {added ? (
              <>
                <Check className="size-4" aria-hidden="true" />
                Moved
              </>
            ) : (
              <>
                <ShoppingBag className="size-4" aria-hidden="true" />
                Move to cart
              </>
            )}
          </Button>
          <button
            type="button"
            aria-label={`Remove ${item.name} from wishlist`}
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.product_id)}
            className="grid size-9 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring disabled:opacity-40"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </Card>
    </motion.li>
  );
}

export default function WishlistPage() {
  const user = useAuthStore((s) => s.user);
  const { data: items = [], isLoading, isError, error, refetch } = useWishlist();
  const status = error?.response?.status;

  if (!user || status === 401) {
    return (
      <Page>
        <h1 className="text-h1 text-ink-primary">Your wishlist</h1>
        <div className="mt-6">
          <EmptyState
            icon={Lock}
            title="Sign in to view your wishlist"
            description="Saved items follow you across devices once you sign in."
            action={
              <Link to="/login?next=/wishlist">
                <Button size="sm">Sign in</Button>
              </Link>
            }
          />
        </div>
      </Page>
    );
  }

  if (isError) {
    return (
      <Page>
        <h1 className="text-h1 text-ink-primary">Your wishlist</h1>
        <div className="mt-6">
          <EmptyState
            icon={AlertTriangle}
            title="We couldn't load your wishlist"
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
      <Breadcrumbs current="Wishlist" className="mb-6" />
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-h1 text-ink-primary">Your wishlist</h1>
          {!isLoading && items.length > 0 && (
            <p className="mt-1 text-sm text-ink-secondary">
              {items.length} saved item{items.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="Tap the heart on any product to save it for later."
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
        <motion.ul
          className="mt-6 flex flex-col gap-3"
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="show"
        >
          {items.map((item) => (
            <WishlistItem key={item.id} item={item} />
          ))}
        </motion.ul>
      )}
    </Page>
  );
}
