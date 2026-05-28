import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  ShoppingBag,
  Wallet,
  AlertTriangle,
  TicketPercent,
  Banknote,
  CheckCircle2,
  XCircle,
  Split,
  Smartphone,
  Building2,
  CreditCard,
  WalletCards,
} from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useCart } from '@/features/cart/hooks.js';
import { useProduct } from '@/features/products/hooks.js';
import { useCheckout } from '@/features/payments/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import { useRateQuote } from '@/features/shipping/hooks.js';
import { readSavedPincode } from '@/features/shipping/storage.js';
import FreeShippingNudge from '@/features/shipping/components/FreeShippingNudge.jsx';
import { useCodCheck } from '@/features/cod/hooks.js';
import CodOtpModal from '@/features/cod/components/CodOtpModal.jsx';
import { usePaymentInstruments } from '@/features/payments/instruments.js';
import { usePublicSettings } from '@/features/settings/public.js';
import { cn, formatPrice } from '@/lib/utils.js';

const INSTRUMENT_ICONS = {
  upi: Smartphone,
  netbanking: Building2,
  card: CreditCard,
  wallet: WalletCards,
};
import { fadeUp } from '@/lib/motion.js';

// Pulls the first 6-digit run from the free-text address. Returns '' if none
// found. Cheaper + more reliable than asking the customer to enter the pin
// twice — most Indian shipping addresses end with "... PIN 110001".
function extractPincode(address) {
  const m = (address || '').match(/\b(\d{6})\b/);
  return m ? m[1] : '';
}

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

  // Seed the address with the saved pincode (if any) so the customer doesn't
  // have to retype it. Anything else in the address still needs to be entered.
  const [address, setAddress] = useState(() => {
    const saved = readSavedPincode();
    return saved ? `\n${saved}` : '';
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  // 'prepaid' | 'cod' | 'split_cod' — the picker. Defaults to prepaid to match prior behavior.
  const [paymentMethod, setPaymentMethod] = useState('prepaid');
  // When `paymentMethod` is 'prepaid', the customer also picks an
  // instrument (UPI / Netbanking / Card / Wallet). Default is set on the
  // server's "suggested" once we load it.
  const [paymentInstrument, setPaymentInstrument] = useState(null);
  // Customer phone — used for tracking SMS and (when COD + OTP required)
  // as the verification target. Defaults from the account if set.
  const [customerPhone, setCustomerPhone] = useState(() => user?.phone || '');
  // When set, the OTP modal is open; resolves to `true` once verified.
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const pincode = extractPincode(address);

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

  // Live rate quote — fires only when the address contains a valid pin and
  // we have items. The backend is the authoritative source at checkout, so
  // this is purely for the summary display.
  const { data: quote } = useRateQuote(pincode, checkoutItems);
  const shippingAmount = quote ? Number(quote.amount) : 0;

  // COD availability for this cart + pincode. The backend re-runs the gate
  // chain at checkout, so this is purely for the picker UI.
  const { data: codCheck } = useCodCheck(pincode, checkoutItems);
  const codAvailable = !!codCheck?.available;
  const codSurcharge = codCheck ? Number(codCheck.surcharge_amount) : 0;
  const splitAvailable = !!codCheck?.split_available;
  const splitPrepaid = codCheck ? Number(codCheck.split_prepaid_amount) : 0;

  // Payment instruments (UPI / Netbanking / Card / Wallet). Only relevant
  // when `paymentMethod` is 'prepaid' or 'split_cod'.
  const { data: instrumentsData } = usePaymentInstruments();
  const enabledInstruments = (instrumentsData?.items || []).filter((i) => i.enabled);
  const suggestedInstrument = enabledInstruments.find((i) => i.suggested);

  // Seed `paymentInstrument` once the list arrives — pick the server's
  // suggested one (or the first enabled). Effect, not inline, so we don't
  // setState during render.
  useEffect(() => {
    if (paymentInstrument || enabledInstruments.length === 0) return;
    setPaymentInstrument((suggestedInstrument || enabledInstruments[0]).code);
  }, [paymentInstrument, enabledInstruments, suggestedInstrument]);

  // If the customer's selected method/instrument becomes unavailable (cart
  // change, setting flip), fall back gracefully.
  useEffect(() => {
    if (!codCheck) return;
    if (paymentMethod === 'cod' && !codAvailable) setPaymentMethod('prepaid');
    if (paymentMethod === 'split_cod' && !splitAvailable) setPaymentMethod('prepaid');
  }, [paymentMethod, codCheck, codAvailable, splitAvailable]);

  useEffect(() => {
    if (!instrumentsData) return;
    if (paymentInstrument && !enabledInstruments.some((i) => i.code === paymentInstrument)) {
      setPaymentInstrument(
        (suggestedInstrument || enabledInstruments[0])?.code || null,
      );
    }
  }, [instrumentsData, paymentInstrument, enabledInstruments, suggestedInstrument]);

  // The active instrument's discount % — used to compute the discount on
  // the order subtotal for the picker preview. Server is authoritative.
  const activeInstrument = enabledInstruments.find((i) => i.code === paymentInstrument);
  const instrumentDiscountPct = activeInstrument
    ? Number(activeInstrument.discount_percent || 0)
    : 0;
  // Instrument discount applies only when the method touches the gateway.
  const instrumentApplies = paymentMethod === 'prepaid' || paymentMethod === 'split_cod';
  const instrumentDiscount = instrumentApplies
    ? Math.round(((subtotal + taxAmount) * instrumentDiscountPct) / 100 * 100) / 100
    : 0;

  // COD surcharge applies to both 'cod' and 'split_cod' for the display total.
  const codSurchargeApplied =
    paymentMethod === 'cod' || paymentMethod === 'split_cod' ? codSurcharge : 0;

  const displayedTotal = Math.max(
    0,
    total + shippingAmount + codSurchargeApplied - instrumentDiscount,
  );
  // For Split COD the balance the carrier collects = displayedTotal − prepaid.
  const splitBalance = Math.max(0, displayedTotal - splitPrepaid);

  // Whether the OTP step is required for this checkout. Public settings
  // expose the admin's toggle so we don't issue a doomed /cod/send-otp on
  // stores that don't use it.
  const { data: publicSettings } = usePublicSettings();
  const codOtpRequired =
    paymentMethod === 'cod' &&
    String(publicSettings?.['cod.require_otp'] || 'true').toLowerCase() === 'true';

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

  function startPay() {
    // COD with OTP required: open the modal first. The modal calls
    // submitCheckout() on success.
    if (codOtpRequired && !otpVerified) {
      setError(null);
      if (!customerPhone || customerPhone.trim().length < 8) {
        setError('Enter your phone number above to receive the OTP.');
        return;
      }
      setOtpOpen(true);
      return;
    }
    submitCheckout();
  }

  async function submitCheckout() {
    setSubmitting(true);
    setError(null);
    try {
      const resp = await checkout.mutateAsync({
        items: checkoutItems,
        shipping_address: address.trim(),
        payment_method: paymentMethod,
        // Instrument only matters for gateway-routed methods. COD ignores it
        // server-side but we omit it from the body to keep the payload tidy.
        ...(instrumentApplies && paymentInstrument
          ? { payment_instrument: paymentInstrument }
          : {}),
        // Phone is always sent when present (used for tracking SMS on
        // prepaid orders and as the OTP target on COD orders).
        ...(customerPhone?.trim()
          ? { customer_phone: customerPhone.trim() }
          : {}),
        // Pincode is parsed out of the address; we send it explicitly so the
        // backend doesn't have to parse free-text and so shipping is quoted
        // server-side against the exact pin we showed in the summary.
        ...(pincode ? { shipping_pincode: pincode } : {}),
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

              <div className="mt-4">
                <label className="block text-sm font-medium text-ink-primary" htmlFor="ship-phone">
                  Phone {codOtpRequired && <span className="text-warning">(OTP verification required for COD)</span>}
                </label>
                <input
                  id="ship-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    // Editing the phone invalidates a prior OTP verification.
                    setOtpVerified(false);
                  }}
                  placeholder="+91 98765 43210"
                  className="mt-2 w-full rounded-sm border border-line-subtle bg-bg-elevated p-3 text-sm text-ink-primary focus-visible:focus-ring"
                />
                <p className="mt-1 text-[11px] text-ink-tertiary">
                  We use this for delivery updates
                  {codOtpRequired ? ' and the COD verification SMS.' : '.'}
                </p>
              </div>

              <h2 className="mt-8 text-h3 text-ink-primary">Payment method</h2>
              <div className="mt-3 flex flex-col gap-2">
                {/* Instrument-level prepaid cards. Each instrument is a
                    sibling card so the customer picks a specific rail
                    (instead of a generic "Pay online" → instrument step
                    on the gateway). */}
                {enabledInstruments.length > 0 && (
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">
                    {suggestedInstrument
                      ? 'Suggested payment method'
                      : 'Pay online'}
                  </p>
                )}
                {enabledInstruments.map((inst) => {
                  const Icon = INSTRUMENT_ICONS[inst.code] || Wallet;
                  const selected =
                    paymentMethod === 'prepaid' && paymentInstrument === inst.code;
                  const discount = Number(inst.discount_percent || 0);
                  return (
                    <button
                      key={inst.code}
                      type="button"
                      onClick={() => {
                        setPaymentMethod('prepaid');
                        setPaymentInstrument(inst.code);
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-sm border p-4 text-left transition-colors',
                        selected
                          ? 'border-accent bg-accent/5'
                          : 'border-line-subtle bg-bg-elevated hover:border-line-strong',
                      )}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-accent/15 text-accent">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-ink-primary">
                            {inst.label}
                          </p>
                          {inst.suggested && (
                            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                              Suggested
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                              Extra {discount}% off
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-secondary">
                          {inst.description}
                        </p>
                      </div>
                      {selected && (
                        <CheckCircle2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}

                {/* COD */}
                <button
                  type="button"
                  onClick={() => codAvailable && setPaymentMethod('cod')}
                  disabled={!codAvailable}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-sm border p-4 text-left transition-colors',
                    !codAvailable && 'cursor-not-allowed opacity-60',
                    codAvailable && paymentMethod === 'cod'
                      ? 'border-accent bg-accent/5'
                      : codAvailable
                      ? 'border-line-subtle bg-bg-elevated hover:border-line-strong'
                      : 'border-line-subtle bg-bg-elevated',
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-warning/15 text-warning">
                    <Banknote className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink-primary">
                        Cash on Delivery
                      </p>
                      {codCheck && codAvailable && codSurcharge > 0 && (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                          +{formatPrice(codSurcharge)} fee
                        </span>
                      )}
                    </div>
                    {codAvailable ? (
                      <p className="text-xs text-ink-secondary">
                        Pay {formatPrice(displayedTotal)} on delivery. We&apos;ll send your order
                        to the carrier immediately.
                      </p>
                    ) : codCheck?.reasons?.length ? (
                      <ul className="mt-1 list-disc pl-4 text-xs text-ink-tertiary">
                        {codCheck.reasons.slice(0, 3).map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-ink-tertiary">
                        Checking availability…
                      </p>
                    )}
                  </div>
                  {codAvailable && paymentMethod === 'cod' ? (
                    <CheckCircle2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
                  ) : !codAvailable && codCheck ? (
                    <XCircle className="size-5 shrink-0 text-ink-tertiary" aria-hidden="true" />
                  ) : null}
                </button>

                {/* Split COD — only renders when the admin has enabled it
                    AND the cart total is meaningfully above the prepaid
                    portion. Otherwise hidden entirely so the picker stays
                    tidy on stores that don't offer it. */}
                {splitAvailable && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('split_cod')}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-sm border p-4 text-left transition-colors',
                      paymentMethod === 'split_cod'
                        ? 'border-accent bg-accent/5'
                        : 'border-line-subtle bg-bg-elevated hover:border-line-strong',
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-blue-500/15 text-blue-400">
                      <Split className="size-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink-primary">
                          Split COD
                        </p>
                        {codSurcharge > 0 && (
                          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                            +{formatPrice(codSurcharge)} fee
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-secondary">
                        Pay <span className="font-semibold text-ink-primary">
                          {formatPrice(splitPrepaid)}
                        </span> now via PhonePe,{' '}
                        <span className="font-semibold text-ink-primary">
                          {formatPrice(splitBalance)}
                        </span> on delivery.
                      </p>
                    </div>
                    {paymentMethod === 'split_cod' && (
                      <CheckCircle2 className="size-5 shrink-0 text-accent" aria-hidden="true" />
                    )}
                  </button>
                )}
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
              <div className="mt-3">
                <FreeShippingNudge subtotal={subtotal} />
              </div>
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
                  {quote ? (
                    <dd className="text-ink-primary tabular-nums">
                      {formatPrice(shippingAmount)}
                    </dd>
                  ) : pincode ? (
                    <dd className="text-ink-tertiary text-xs">Calculating…</dd>
                  ) : (
                    <dd className="text-ink-tertiary text-xs">
                      Add a 6-digit pincode to the address
                    </dd>
                  )}
                </div>
                {(paymentMethod === 'cod' || paymentMethod === 'split_cod') &&
                  codSurcharge > 0 && (
                    <div className="mt-2 flex justify-between text-ink-secondary">
                      <dt>COD fee</dt>
                      <dd className="text-ink-primary tabular-nums">
                        {formatPrice(codSurcharge)}
                      </dd>
                    </div>
                  )}
                {instrumentApplies && instrumentDiscount > 0 && activeInstrument && (
                  <div className="mt-2 flex justify-between text-success">
                    <dt className="inline-flex items-center gap-1">
                      <span className="capitalize">{activeInstrument.label}</span>
                      <span className="font-mono text-[10px] text-ink-tertiary">
                        ({instrumentDiscountPct}% off)
                      </span>
                    </dt>
                    <dd className="tabular-nums">−{formatPrice(instrumentDiscount)}</dd>
                  </div>
                )}
                {paymentMethod === 'split_cod' && (
                  <div className="mt-2 rounded-sm border border-line-subtle bg-bg-sunken px-2.5 py-2 text-[11px] text-ink-tertiary">
                    Now: <span className="font-mono text-ink-primary">{formatPrice(splitPrepaid)}</span>
                    {' · '}
                    On delivery: <span className="font-mono text-ink-primary">{formatPrice(splitBalance)}</span>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex justify-between border-t border-line-subtle pt-4">
                <span className="text-sm text-ink-secondary">Total</span>
                <span className="text-h3 text-ink-primary tabular-nums">
                  {formatPrice(displayedTotal)}
                </span>
              </div>
              <Button
                block
                size="lg"
                className="mt-5"
                onClick={startPay}
                disabled={!canSubmit}
                loading={submitting}
              >
                {paymentMethod === 'cod'
                  ? `Place order · ${formatPrice(displayedTotal)} on delivery`
                  : paymentMethod === 'split_cod'
                  ? `Pay ${formatPrice(splitPrepaid)} now via PhonePe`
                  : 'Pay with PhonePe'}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-tertiary">
                <Lock className="size-3" aria-hidden="true" />
                {paymentMethod === 'cod'
                  ? 'Carrier collects on delivery — no online payment'
                  : paymentMethod === 'split_cod'
                  ? `Balance ${formatPrice(splitBalance)} collected on delivery`
                  : 'Encrypted handoff to PhonePe'}
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

      {otpOpen && (
        <CodOtpModal
          phone={customerPhone.trim()}
          onClose={() => setOtpOpen(false)}
          onVerified={() => {
            setOtpVerified(true);
            setOtpOpen(false);
            submitCheckout();
          }}
        />
      )}
    </Page>
  );
}
