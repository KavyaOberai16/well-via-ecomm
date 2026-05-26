import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Check,
  Truck,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { ProductGallery } from '@/features/products/components/ProductGallery.jsx';
import { useProduct } from '@/features/products/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { formatPrice, stockLabel } from '@/lib/utils.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { data: product, isLoading, isError } = useProduct(id);
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);

  if (isLoading) {
    return (
      <Page>
        <div className="grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-[4/5] rounded-lg" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Page>
    );
  }

  if (isError || !product) {
    return (
      <Page>
        <EmptyState
          icon={AlertTriangle}
          title="Product not found"
          description="This product may have been removed or never existed."
          action={
            <Link to="/products">
              <Button size="sm">Back to shop</Button>
            </Link>
          }
        />
      </Page>
    );
  }

  const outOfStock = product.stock <= 0;
  const stock = stockLabel(product.stock);
  const maxQty = Math.max(1, product.stock);

  return (
    <Page>
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 rounded-sm text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <ProductGallery product={product} />
        </motion.div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-wide text-ink-tertiary">
            {product.sku}
          </p>
          <h1 className="mt-2 text-h1 text-ink-primary text-balance">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-h2 text-ink-primary">{formatPrice(product.price)}</span>
            <Badge tone={stock.tone}>{stock.text}</Badge>
          </div>

          {product.description && (
            <p className="mt-5 text-base text-ink-secondary">{product.description}</p>
          )}

          {/* Quantity + add to cart */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex h-11 items-center rounded-sm border border-line-subtle bg-bg-sunken">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid size-11 place-items-center text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center text-sm tabular-nums text-ink-primary">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={qty >= maxQty}
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="grid size-11 place-items-center text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <Button
              size="lg"
              block
              className="sm:flex-1"
              disabled={outOfStock}
              loading={addToCart.isPending}
              onClick={() => addToCart.mutate({ productId: product.id, quantity: qty })}
            >
              {addToCart.isSuccess ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Added to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  {outOfStock ? 'Out of stock' : 'Add to cart'}
                </>
              )}
            </Button>
          </div>

          {addToCart.isError && (
            <p className="mt-3 text-xs text-danger">
              Couldn't add to cart — please sign in and try again.
            </p>
          )}

          {/* Reassurance */}
          <ul className="mt-8 flex flex-col gap-3 border-t border-line-subtle pt-6">
            <li className="flex items-center gap-3 text-sm text-ink-secondary">
              <Truck className="size-4 text-accent" aria-hidden="true" />
              Free delivery on this order
            </li>
            <li className="flex items-center gap-3 text-sm text-ink-secondary">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              Secure, encrypted checkout
            </li>
          </ul>
        </div>
      </div>
    </Page>
  );
}
