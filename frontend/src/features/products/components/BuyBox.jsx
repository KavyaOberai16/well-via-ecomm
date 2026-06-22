import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Zap, Lock, Truck, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button.jsx';
import { useAddToCart } from '@/features/cart/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import { formatPrice } from '@/lib/utils.js';
import { WishlistButton } from '@/features/wishlist/WishlistButton.jsx';

/**
 * Right-rail buy box — the "convert" panel.
 *
 * Two actions stacked, mirroring Amazon's hierarchy:
 *   1. Add to Cart  — adds to the persistent cart, stays on page.
 *   2. Buy Now      — skips the cart and jumps to /checkout pre-loaded with
 *                     this one product. (Read by CheckoutPage from query
 *                     params, so no extra state plumbing is needed.)
 *
 * Buttons use our theme tokens but warm them to match the iconic yellow/orange
 * Amazon hierarchy without looking out of place against the dark surface.
 */
export function BuyBox({ product }) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const user = useAuthStore((s) => s.user);

  const maxQty = Math.max(1, product.stock);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const deliveryDates = useMemo(() => makeDeliveryDates(), []);
  const outOfStock = product.stock <= 0;

  function handleAddToCart() {
    if (!user) {
      navigate(`/login?next=/products/${product.id}`);
      return;
    }
    addToCart.mutate(
      { productId: product.id, quantity: qty },
      { onSuccess: () => setAdded(true) },
    );
  }

  function handleBuyNow() {
    // Hand off to /checkout with a buyNow query — CheckoutPage will use this
    // one product instead of the cart contents.
    const target = `/checkout?buyNow=${product.id}&qty=${qty}`;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  }

  return (
    <aside
      aria-label="Purchase options"
      className="rounded-lg border border-line-subtle bg-bg-elevated p-5 lg:sticky lg:top-24"
    >
      {/* Price */}
      <p className="text-h2 text-ink-primary tabular-nums">
        {formatPrice(product.price)}
      </p>
      <p className="mt-1 text-xs text-ink-tertiary">Inclusive of all taxes.</p>

      {/* Delivery */}
      <div className="mt-4 space-y-1.5 text-sm">
        <p className="text-ink-primary">
          <span className="text-ink-tertiary">Free delivery</span>{' '}
          <strong>{deliveryDates.free}</strong>
        </p>
        <p className="text-ink-secondary">
          <span className="text-ink-tertiary">Or fastest by</span>{' '}
          <strong className="text-accent">{deliveryDates.fast}</strong>
        </p>
      </div>

      {/* Stock */}
      <p
        className={`mt-4 text-base font-semibold ${
          outOfStock ? 'text-danger' : product.stock <= 5 ? 'text-warning' : 'text-success'
        }`}
      >
        {outOfStock
          ? 'Out of stock'
          : product.stock <= 5
            ? `Only ${product.stock} left in stock`
            : 'In stock'}
      </p>

      {/* Quantity */}
      <div className="mt-4">
        <label className="text-xs font-medium text-ink-secondary" htmlFor="qty">
          Quantity
        </label>
        <div className="mt-1.5 flex h-10 w-fit items-center rounded-sm border border-line-subtle bg-bg-sunken">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={qty <= 1 || outOfStock}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-10 place-items-center text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <span
            id="qty"
            className="w-10 text-center text-sm tabular-nums text-ink-primary"
          >
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={qty >= maxQty || outOfStock}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="grid size-10 place-items-center text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock || addToCart.isPending}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f7c64a] text-sm font-semibold text-[#1a1408] shadow-sm transition-[transform,filter] hover:brightness-105 hover:-translate-y-px focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none"
        >
          {added ? (
            <>
              <Check className="size-4" aria-hidden="true" />
              Added to cart
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" aria-hidden="true" />
              Add to Cart
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#f0903a] text-sm font-semibold text-[#1a1408] shadow-sm transition-[transform,filter] hover:brightness-105 hover:-translate-y-px focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none"
        >
          <Zap className="size-4" aria-hidden="true" />
          Buy Now
        </button>

        <WishlistButton productId={product.id} variant="inline" />
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-tertiary">
        <Lock className="size-3" aria-hidden="true" />
        Secure transaction
      </p>

      {/* Footer mini-info */}
      <ul className="mt-5 flex flex-col gap-2 border-t border-line-subtle pt-4 text-xs">
        <Row icon={Truck} label="Ships from" value="ShopWell warehouse" />
        <Row icon={ShieldCheck} label="Sold by" value="ShopWell Retail" />
        <Row icon={RotateCcw} label="Returns" value="7 days from delivery" />
      </ul>

      {addToCart.isError && !addToCart.isPending && (
        <p className="mt-3 text-xs text-danger">
          Couldn't add to cart — try signing in again.
        </p>
      )}
    </aside>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <li className="flex items-start gap-2 text-ink-secondary">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-ink-tertiary" aria-hidden="true" />
      <div className="flex-1">
        <span className="text-ink-tertiary">{label}:</span>{' '}
        <span className="text-ink-primary">{value}</span>
      </div>
    </li>
  );
}

/** Free delivery ~5 days out, fast delivery tomorrow. Format like "Sun, 31 May". */
function makeDeliveryDates() {
  const fmt = (d) =>
    d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const free = new Date();
  free.setDate(free.getDate() + 5);
  return { free: fmt(free), fast: fmt(tomorrow) };
}
