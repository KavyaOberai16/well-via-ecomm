import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Lock,
  AlertTriangle,
  TicketPercent,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import {
  useCart,
  useRemoveFromCart,
  useApplyCoupon,
  useRemoveCoupon,
  useUpdateCartQuantity,
} from '@/features/cart/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import PincodeCheck from '@/features/shipping/components/PincodeCheck.jsx';
import FreeShippingNudge from '@/features/shipping/components/FreeShippingNudge.jsx';
import { useRateQuote } from '@/features/shipping/hooks.js';
import { formatPrice } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

function CouponBlock({ appliedCode, discount }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();

  async function handleApply(e) {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Enter a coupon code.');
      return;
    }
    try {
      await apply.mutateAsync(trimmed.toUpperCase());
      setCode('');
    } catch (err) {
      setError(err.response?.data?.error?.message || "That code couldn't be applied.");
    }
  }

  if (appliedCode) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-sm border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm">
        <div className="flex min-w-0 items-center gap-2">
          <TicketPercent className="size-4 shrink-0 text-accent" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-semibold text-ink-primary">
              {appliedCode}
            </p>
            <p className="text-[11px] text-ink-secondary">
              Saving {formatPrice(discount)}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label={`Remove coupon ${appliedCode}`}
          disabled={remove.isPending}
          onClick={() => remove.mutate()}
          className="grid size-8 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-bg-elevated hover:text-ink-primary focus-visible:focus-ring disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="mt-4">
      <p className="mb-1.5 text-xs font-medium text-ink-secondary">Have a coupon?</p>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Input
            placeholder="WELCOME10"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={error}
            // Tighter helper area for the inline layout.
            className="uppercase placeholder:normal-case"
          />
        </div>
        <Button type="submit" size="md" variant="secondary" loading={apply.isPending}>
          Apply
        </Button>
      </div>
    </form>
  );
}

export default function CartPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = useCart();
  const removeItem = useRemoveFromCart();
  const updateQty = useUpdateCartQuantity();
  // null   = no pincode entered yet (button stays enabled, customer can edit shipping at checkout)
  // false  = entered + non-serviceable (block checkout)
  // true   = entered + serviceable (button enabled)
  const [serviceable, setServiceable] = useState(null);
  const [activePincode, setActivePincode] = useState('');

  const items = data?.items ?? [];
  const subtotal = Number(data?.subtotal ?? 0);
  const taxAmount = Number(data?.tax_amount ?? 0);
  const discountAmount = Number(data?.discount_amount ?? 0);
  const cartTotal = Number(data?.total ?? subtotal + taxAmount - discountAmount);
  // Only quote when the entered pin is serviceable — non-serviceable carts
  // can't ship anyway, and a spurious 4xx during typing isn't useful.
  const rateInputItems = serviceable
    ? items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
    : [];
  const { data: quote } = useRateQuote(
    serviceable ? activePincode : '',
    rateInputItems,
  );
  const shippingAmount = quote ? Number(quote.amount) : 0;
  const total = cartTotal + shippingAmount;
  const couponCode = data?.coupon_code;
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
            {items.map((item) => {
              const mrp = item.compare_at_price && Number(item.compare_at_price) > Number(item.unit_price)
                ? Number(item.compare_at_price)
                : null;
              return (
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
                        {formatPrice(item.unit_price)}
                        {mrp && (
                          <span className="ml-1.5 text-xs text-ink-tertiary line-through">
                            {formatPrice(mrp)}
                          </span>
                        )}
                      </p>
                      {Number(item.line_tax) > 0 && (
                        <p className="mt-0.5 text-[11px] text-ink-tertiary">
                          incl. {formatPrice(item.line_tax)} tax
                        </p>
                      )}
                      {/* Quantity stepper — sets absolute via PUT /cart/items/{id}.
                          qty=0 drops the line, but we still show the trash icon
                          for the explicit-removal affordance. */}
                      <div className="mt-2 inline-flex items-center gap-1 rounded-sm border border-line-subtle bg-bg-sunken">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={updateQty.isPending || item.quantity <= 1}
                          onClick={() =>
                            updateQty.mutate({
                              productId: item.product_id,
                              quantity: item.quantity - 1,
                            })
                          }
                          className="grid size-7 place-items-center text-ink-secondary hover:text-ink-primary disabled:opacity-30"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="min-w-[2ch] text-center text-xs tabular-nums text-ink-primary">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={updateQty.isPending}
                          onClick={() =>
                            updateQty.mutate({
                              productId: item.product_id,
                              quantity: item.quantity + 1,
                            })
                          }
                          className="grid size-7 place-items-center text-ink-secondary hover:text-ink-primary disabled:opacity-30"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
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
              );
            })}
          </motion.ul>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-5">
              <h2 className="text-h3 text-ink-primary">Order summary</h2>
              <div className="mt-3">
                <FreeShippingNudge subtotal={subtotal} />
              </div>
              <dl className="mt-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-ink-secondary">
                  <dt>Subtotal</dt>
                  <dd className="text-ink-primary tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-ink-secondary">
                    <dt>Tax</dt>
                    <dd className="text-ink-primary tabular-nums">{formatPrice(taxAmount)}</dd>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>
                      Discount
                      {couponCode && (
                        <span className="ml-1 font-mono text-[10px] text-ink-tertiary">
                          ({couponCode})
                        </span>
                      )}
                    </dt>
                    <dd className="tabular-nums">−{formatPrice(discountAmount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-ink-secondary">
                  <dt>Delivery</dt>
                  {quote ? (
                    <dd className="text-ink-primary tabular-nums">
                      {formatPrice(shippingAmount)}
                    </dd>
                  ) : (
                    <dd className="text-ink-tertiary text-xs">
                      Check pincode below
                    </dd>
                  )}
                </div>
              </dl>
              <div className="mt-4 flex justify-between border-t border-line-subtle pt-4">
                <span className="text-sm text-ink-secondary">Total</span>
                <span className="text-h3 text-ink-primary tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>

              <CouponBlock appliedCode={couponCode} discount={discountAmount} />

              <PincodeCheck
                onResult={(r) => {
                  setServiceable(r.serviceable);
                  setActivePincode(r.pincode);
                }}
              />

              {serviceable === false ? (
                <Button block size="lg" disabled className="mt-5">
                  Delivery unavailable
                </Button>
              ) : (
                <Link to="/checkout" className="mt-5 block">
                  <Button block size="lg">
                    Proceed to checkout
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </Link>
              )}
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
