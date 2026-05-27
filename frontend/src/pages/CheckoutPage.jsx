import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, ShoppingBag, Wallet, AlertTriangle, TicketPercent } from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useCart } from '@/features/cart/hooks.js';
import { useProduct } from '@/features/products/hooks.js';
import { useCheckout } from '@/features/payments/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import { formatPrice } from '@/lib/utils.js';
import { fadeUp } from '@/lib/motion.js';

// Mirrors backend compute_line_tax — active rates sum, applied to (price × qty).
function computeBuyNowTax(product, qty) {
  if (!product?.taxes?.length) return 0;
  const rateSum = product.taxes
    .filter((t) => t.is_active !== false)
    .reduce((a, t) => a + Number(t.rate), 0);
  return Math.round(Number(product.price) * qty * rateSum) / 100;
}

export default function CheckoutPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Buy-now mode: ?buyNow=<id>&qty=<n>. Bypasses the cart and checks out
  // exactly that single line. Used by the product page's "Buy Now" button.
  const buyNowId = params.get('buyNow');
  const buyNowQty = Math.max(1, Number(params.get('qty') || 1));
  const buyNowMode = !!buyNowId;

  const { data: buyNowProduct, isLoading: buyNowLoading } = useProduct(
    buyNowMode ? buyNowId : null,
  );
  const { data: cart, isLoading: cartLoading } = useCart();
  const checkout = useCheckout();

  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isLoading = buyNowMode ? buyNowLoading : cartLoading;

  // Unify both sources into one shape: items list + the totals to display.
  // Cart mode trusts the server's numbers. Buy-now mode computes tax locally
  // (no coupon possible — coupons attach to the persistent cart).
  const { items, subtotal, taxAmount, discountAmount, total, couponCode, checkoutItems } =
    useMemo(() => {
      if (buyNowMode) {
        if (!buyNowProduct) {
          return {
            items: [],
            subtotal: 0,
            taxAmount: 0,
            discountAmount: 0,
            total: 0,
            couponCode: null,
            checkoutItems: [],
          };
        }
        const lineSubtotal = Number(buyNowProduct.price) * buyNowQty;
        const lineTax = computeBuyNowTax(buyNowProduct, buyNowQty);
        return {
          items: [
            {
              product_id: buyNowProduct.id,
              name: buyNowProduct.name,
              quantity: buyNowQty,
              unit_price: buyNowProduct.price,
              line_total: lineSubtotal + lineTax,
            },
          ],
          subtotal: lineSubtotal,
          taxAmount: lineTax,
          discountAmount: 0,
          total: lineSubtotal + lineTax,
          couponCode: null,
          checkoutItems: [{ product_id: buyNowProduct.id, quantity: buyNowQty }],
        };
      }
      const items = cart?.items ?? [];
      return {
        items,
        subtotal: Number(cart?.subtotal ?? 0),
        taxAmount: Number(cart?.tax_amount ?? 0),
        discountAmount: Number(cart?.discount_amount ?? 0),
        total: Number(cart?.total ?? 0),
        couponCode: cart?.coupon_code || null,
        checkoutItems: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      };
    }, [buyNowMode, buyNowProduct, buyNowQty, cart]);

  const canSubmit = items.length > 0 && address.trim().length >= 3 && !submitting;

  if (!user) return <Navigate to="/login" replace />;

  if (!isLoading && items.length === 0) {
    return (
      <Page>
        <h1 className="text-h1 text-ink-primary">Checkout</h1>
        <div className="mt-6">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add a product before heading to checkout."
            action={
              <Link to="/products">
                <Button size="sm">Browse products</Button>
              </Link>
            }
          />
        </div>
      </Page>
    );
  }

  async function handlePay() {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await checkout.mutateAsync({
        items: checkoutItems,
        shipping_address: address.trim(),
        // Only send coupon_code from the cart path; buy-now never carries one.
        ...(couponCode ? { coupon_code: couponCode } : {}),
      });
      // Hand off to the provider's hosted checkout page. The provider — or
      // our mock simulator — redirects back to /payments/return when done.
      window.location.assign(resp.redirect_url);
    } catch (err) {
      setSubmitting(false);
      const msg =
        err?.response?.data?.error?.message ||
        'Could not start payment. Please try again.';
      setError(msg);
    }
  }

  return (
    <Page>
      <Link
        to="/cart"
        className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to cart
      </Link>
      <h1 className="mt-2 text-h1 text-ink-primary">Checkout</h1>

      {isLoading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Shipping + payment method */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Card className="p-6">
              <h2 className="text-h3 text-ink-primary">Shipping address</h2>
              <p className="mt-1 text-sm text-ink-secondary">
                Used only for delivery — never shared.
              </p>
              <label className="mt-5 block text-sm font-medium text-ink-primary" htmlFor="ship">
                Full address
              </label>
              <textarea
                id="ship"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no, street, city, state, PIN"
                className="mt-2 w-full resize-none rounded-sm border border-line-subtle bg-bg-elevated p-3 text-sm text-ink-primary focus-visible:focus-ring"
              />

              <h2 className="mt-8 text-h3 text-ink-primary">Payment method</h2>
              <div className="mt-3 flex items-center gap-3 rounded-sm border border-line-subtle bg-bg-elevated p-4">
                <span className="grid size-10 place-items-center rounded-sm bg-accent/15 text-accent">
                  <Wallet className="size-5" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-primary">PhonePe</p>
                  <p className="text-xs text-ink-secondary">
                    UPI, cards, wallets and net-banking through PhonePe&apos;s secure page.
                  </p>
                </div>
                <span className="rounded-full border border-line-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">
                  Selected
                </span>
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <h2 className="text-h3 text-ink-primary">Order summary</h2>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                {items.map((i) => (
                  <li
                    key={i.product_id}
                    className="flex items-baseline justify-between gap-3 text-ink-secondary"
                  >
                    <span className="truncate">
                      {i.name}{' '}
                      <span className="text-ink-tertiary">× {i.quantity}</span>
                    </span>
                    <span className="text-ink-primary tabular-nums">
                      {formatPrice(i.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 border-t border-line-subtle pt-4 text-sm">
                <div className="flex justify-between text-ink-secondary">
                  <dt>Subtotal</dt>
                  <dd className="text-ink-primary tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                {taxAmount > 0 && (
                  <div className="mt-2 flex justify-between text-ink-secondary">
                    <dt>Tax</dt>
                    <dd className="text-ink-primary tabular-nums">{formatPrice(taxAmount)}</dd>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="mt-2 flex justify-between text-success">
                    <dt className="flex items-center gap-1">
                      <TicketPercent className="size-3.5" aria-hidden="true" />
                      Discount
                      {couponCode && (
                        <span className="font-mono text-[10px] text-ink-tertiary">
                          ({couponCode})
                        </span>
                      )}
                    </dt>
                    <dd className="tabular-nums">−{formatPrice(discountAmount)}</dd>
                  </div>
                )}
                <div className="mt-2 flex justify-between text-ink-secondary">
                  <dt>Delivery</dt>
                  <dd className="text-success">Free</dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-between border-t border-line-subtle pt-4">
                <span className="text-sm text-ink-secondary">Total</span>
                <span className="text-h3 text-ink-primary tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>
              <Button
                block
                size="lg"
                className="mt-5"
                onClick={handlePay}
                disabled={!canSubmit}
                loading={submitting}
              >
                Pay with PhonePe
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-tertiary">
                <Lock className="size-3" aria-hidden="true" />
                Encrypted handoff to PhonePe
              </p>
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="mt-2 w-full text-center text-xs text-ink-tertiary hover:text-ink-secondary"
              >
                Cancel
              </button>
            </Card>
          </div>
        </div>
      )}
    </Page>
  );
}
