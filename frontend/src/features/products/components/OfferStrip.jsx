import { Truck } from 'lucide-react';

/**
 * Single platform-wide guarantee shown beneath the price.
 * Kept as a component (not inlined) so future promo additions are a one-line change.
 */
export function OfferStrip() {
  return (
    <section className="mt-6">
      <h2 className="sr-only">Delivery</h2>
      <div className="flex items-start gap-3 rounded-md border border-line-subtle bg-bg-elevated p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-accent/15 text-accent">
          <Truck className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-primary">Free delivery</p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            On all orders — no minimum value, all serviceable pincodes.
          </p>
        </div>
      </div>
    </section>
  );
}
