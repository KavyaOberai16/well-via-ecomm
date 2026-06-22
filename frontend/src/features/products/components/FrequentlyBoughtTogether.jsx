import { useMemo, useState } from 'react';
import { Plus, ShoppingBag, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { useAddToCart } from '@/features/cart/hooks.js';
import { useAuthStore } from '@/features/auth/store.js';
import { formatPrice } from '@/lib/utils.js';
import { ProductMedia } from './ProductMedia.jsx';

/**
 * Frequently bought together — the source product plus up to 2 companions
 * pre-checked. The user can deselect a companion; the combined price + add
 * action updates accordingly.
 */
export function FrequentlyBoughtTogether({ product, related, isLoading }) {
  const user = useAuthStore((s) => s.user);
  const addToCart = useAddToCart();
  const [doneAt, setDoneAt] = useState(0);

  // Take up to two related products to form the FBT bundle.
  const companions = useMemo(
    () => (related || []).filter((p) => p.stock > 0).slice(0, 2),
    [related],
  );

  // Selected ids — start with everyone selected. Source is always selected.
  const [selected, setSelected] = useState(() => new Set([product.id]));
  // Add the initial companions once they're loaded.
  useMemo(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      companions.forEach((p) => next.add(p.id));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companions.length]);

  const all = [product, ...companions];
  const total = all
    .filter((p) => selected.has(p.id))
    .reduce((acc, p) => acc + Number(p.price), 0);
  const selectedCount = all.filter((p) => selected.has(p.id)).length;

  if (isLoading) {
    return <Skeleton className="mt-12 h-48 rounded-lg" />;
  }
  if (companions.length === 0) return null;

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addAll() {
    if (!user) {
      // Same pattern the buy box uses — pop them into login then bring back.
      window.location.assign(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    const ids = all.filter((p) => selected.has(p.id)).map((p) => p.id);
    await Promise.all(
      ids.map((productId) =>
        addToCart.mutateAsync({ productId, quantity: 1 }),
      ),
    );
    setDoneAt(Date.now());
  }

  return (
    <section className="mt-12">
      <h2 className="text-h3 text-ink-primary">Frequently bought together</h2>
      <Card className="mt-4 p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            {all.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <BundleTile
                  product={p}
                  isSource={i === 0}
                  selected={selected.has(p.id)}
                  onToggle={() => i !== 0 && toggle(p.id)}
                />
                {i < all.length - 1 && (
                  <Plus
                    className="size-4 shrink-0 text-ink-tertiary"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="lg:w-48">
            <p className="text-xs uppercase tracking-wide text-ink-tertiary">
              Total {selectedCount > 1 ? `(${selectedCount} items)` : ''}
            </p>
            <p className="mt-1 text-h2 text-ink-primary tabular-nums">
              {formatPrice(total)}
            </p>
            <button
              type="button"
              onClick={addAll}
              disabled={selectedCount === 0 || addToCart.isPending}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-ink-inverse shadow-glow transition-[transform,filter] hover:brightness-105 hover:-translate-y-px focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none"
            >
              {doneAt ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  Add all to cart
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}

function BundleTile({ product, isSource, selected, onToggle }) {
  return (
    <label
      className={`flex items-center gap-3 rounded-md border p-2 transition-colors ${
        selected
          ? 'border-accent/60 bg-accent/5'
          : 'border-line-subtle bg-bg-sunken hover:border-line-strong'
      } ${isSource ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={isSource}
        onChange={onToggle}
        aria-label={`Include ${product.name} in bundle`}
        className="size-4 shrink-0 accent-accent"
      />
      <div className="size-14 shrink-0 overflow-hidden rounded-sm border border-line-subtle bg-bg-elevated">
        <ProductMedia product={product} />
      </div>
      <div className="min-w-0 max-w-[180px]">
        <p className="line-clamp-2 text-xs font-medium text-ink-primary">
          {product.name}
        </p>
        <p className="mt-1 text-xs text-ink-secondary tabular-nums">
          {formatPrice(product.price)}
        </p>
        {isSource && (
          <p className="text-[10px] uppercase tracking-wide text-accent">This item</p>
        )}
      </div>
    </label>
  );
}
