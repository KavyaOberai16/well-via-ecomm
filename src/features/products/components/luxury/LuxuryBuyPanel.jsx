import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Minus,
  Plus,
  ShoppingBag,
  Zap,
  Check,
  Share2,
  Truck,
  RotateCcw,
  ShieldCheck,
  Lock,
  CreditCard,
} from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils.js';
import { useAddToCart } from '@/features/cart/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import { WishlistButton } from '@/features/wishlist/WishlistButton.jsx';
import { StarRating } from '@/features/reviews/StarRating.jsx';

/**
 * The conversion panel — frosted, floating, sticky on desktop.
 *
 * Everything shown is real or a transparent derivation of real data:
 *   - discount % is computed from `compare_at_price` (which the old buy box
 *     didn't even surface),
 *   - the EMI line is a plain arithmetic estimate of price ÷ tenure and is
 *     labelled as such — no fictitious "no-cost" claims,
 *   - delivery dates are relative to today, stock/returns come straight off
 *     the product + platform policy.
 */
export function LuxuryBuyPanel({ product }) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const user = useAuthStore((s) => s.user);

  const maxQty = Math.max(1, product.stock);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);

  const price = Number(product.price) || 0;
  const compareAt = Number(product.compare_at_price) || 0;
  const hasDiscount = compareAt > price;
  const discountPct = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;
  const saved = hasDiscount ? compareAt - price : 0;

  // EMI estimate — shown only when the ticket is large enough for it to matter.
  const emiPerMonth = price >= 3000 ? Math.round(price / 6) : 0;

  const delivery = useMemo(() => makeDeliveryDates(), []);
  const outOfStock = product.stock <= 0;
  const ratingCount = Number(product.rating_count) || 0;

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
    const target = `/checkout?buyNow=${product.id}&qty=${qty}`;
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 1800);
      }
    } catch {
      /* user dismissed the share sheet — nothing to do */
    }
  }

  return (
    <aside
      aria-label="Purchase options"
      className="relative overflow-hidden rounded-lg border border-line-strong bg-bg-elevated p-6 shadow-lg lg:sticky lg:top-24"
    >
      {/* Soft luxury sheen along the top edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-[#B794F4] to-accent"
      />
      {/* Rating */}
      {ratingCount > 0 && (
        <a
          href="#reviews"
          className="mb-4 inline-flex items-center gap-2 rounded-sm text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
        >
          <StarRating value={Number(product.rating_avg) || 0} size="sm" />
          <span className="font-semibold tabular-nums text-ink-primary">
            {Number(product.rating_avg).toFixed(1)}
          </span>
          <span className="text-ink-tertiary">
            ({ratingCount.toLocaleString()} review{ratingCount === 1 ? '' : 's'})
          </span>
        </a>
      )}

      {/* Price */}
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <span className="text-[2rem] font-semibold leading-none tracking-tight text-ink-primary tabular-nums">
          {formatPrice(price)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-base text-ink-tertiary line-through tabular-nums">
              {formatPrice(compareAt)}
            </span>
            <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
              {discountPct}% OFF
            </span>
          </>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-tertiary">
        Inclusive of all taxes.
        {hasDiscount && (
          <span className="ml-1 text-success">You save {formatPrice(saved)}.</span>
        )}
      </p>

      {/* EMI */}
      {emiPerMonth > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-fill px-2.5 py-1.5 text-xs text-ink-secondary">
          <CreditCard className="size-3.5 text-accent" aria-hidden="true" />
          EMI from <strong className="text-ink-primary">{formatPrice(emiPerMonth)}/mo</strong>
          <span className="text-ink-tertiary">· 6 mo (est.)</span>
        </p>
      )}

      {/* Delivery */}
      <div className="mt-5 space-y-1.5 text-sm">
        <p className="text-ink-secondary">
          Free delivery by <strong className="text-ink-primary">{delivery.free}</strong>
        </p>
        <p className="text-ink-secondary">
          Or fastest by <strong className="text-accent">{delivery.fast}</strong>
        </p>
      </div>

      {/* Stock */}
      <p
        className={cn(
          'mt-4 text-sm font-semibold',
          outOfStock ? 'text-danger' : product.stock <= 5 ? 'text-warning' : 'text-success',
        )}
      >
        {outOfStock
          ? 'Out of stock'
          : product.stock <= 5
            ? `Hurry — only ${product.stock} left`
            : 'In stock'}
      </p>

      {/* Quantity */}
      <div className="mt-5">
        <label className="text-xs font-medium text-ink-secondary" htmlFor="lux-qty">
          Quantity
        </label>
        <div className="mt-1.5 flex h-11 w-fit items-center rounded-full border border-line-subtle bg-bg-base/40">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={qty <= 1 || outOfStock}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-11 place-items-center rounded-full text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30"
          >
            <Minus className="size-4" />
          </button>
          <span id="lux-qty" className="w-10 text-center text-sm tabular-nums text-ink-primary">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={qty >= maxQty || outOfStock}
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            className="grid size-11 place-items-center rounded-full text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock || addToCart.isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-ink-inverse shadow-glow transition-[transform,filter] hover:-translate-y-0.5 hover:brightness-105 focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-40"
        >
          {added ? (
            <>
              <Check className="size-4" aria-hidden="true" /> Added to cart
            </>
          ) : (
            <>
              <ShoppingBag className="size-4" aria-hidden="true" /> Add to Cart
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-bg-base/40 text-sm font-semibold text-ink-primary transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-fill focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-40"
        >
          <Zap className="size-4 text-accent" aria-hidden="true" /> Buy Now
        </button>

        <div className="mt-1 grid grid-cols-2 gap-2.5">
          <WishlistButton productId={product.id} variant="inline" />
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-line-subtle bg-bg-base/40 text-sm font-medium text-ink-secondary transition-colors hover:border-line-strong hover:text-ink-primary focus-visible:focus-ring"
          >
            {shared ? (
              <>
                <Check className="size-4" aria-hidden="true" /> Link copied
              </>
            ) : (
              <>
                <Share2 className="size-4" aria-hidden="true" /> Share
              </>
            )}
          </button>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-tertiary">
        <Lock className="size-3" aria-hidden="true" /> Secure, encrypted checkout
      </p>

      {/* Assurances */}
      <ul className="mt-5 grid grid-cols-1 gap-2.5 border-t border-line-subtle pt-5 text-xs">
        <Assurance icon={Truck} label="Free delivery on every order" />
        <Assurance icon={RotateCcw} label="7-day easy returns" />
        <Assurance icon={ShieldCheck} label="100% authentic · Sold by ShopWell" />
      </ul>

      {addToCart.isError && !addToCart.isPending && (
        <p className="mt-3 text-xs text-danger">
          Couldn&apos;t add to cart — try signing in again.
        </p>
      )}
    </aside>
  );
}

function Assurance({ icon: Icon, label }) {
  return (
    <li className="flex items-center gap-2.5 text-ink-secondary">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      {label}
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
