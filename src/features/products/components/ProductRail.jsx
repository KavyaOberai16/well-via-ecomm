import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { formatPrice, stockLabel } from '@/lib/utils.js';
import { ProductMedia } from './ProductMedia.jsx';
import { Badge } from '@/components/ui/Badge.jsx';

/**
 * Horizontally-scrolling product rail, with arrow controls on >=md screens.
 * Touch users can swipe natively; we don't paginate, we just scroll by the
 * card width on click.
 */
export function ProductRail({ title, products, isLoading }) {
  const scroller = useRef(null);

  function scrollBy(dir) {
    const el = scroller.current;
    if (!el) return;
    // Scroll roughly one "card" — pick the first child's width as the unit.
    const step = el.firstElementChild?.getBoundingClientRect().width || 200;
    el.scrollBy({ left: dir * (step + 12), behavior: 'smooth' });
  }

  if (isLoading) {
    return (
      <section className="mt-12">
        <h2 className="text-h3 text-ink-primary">{title}</h2>
        <div className="mt-4 flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60 w-44 shrink-0 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-h3 text-ink-primary">{title}</h2>
        <div className="hidden gap-1.5 md:flex">
          <ArrowBtn onClick={() => scrollBy(-1)} dir="left" />
          <ArrowBtn onClick={() => scrollBy(1)} dir="right" />
        </div>
      </div>

      <div
        ref={scroller}
        className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
      >
        {products.map((p) => (
          <RailCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function RailCard({ product }) {
  const stock = stockLabel(product.stock);
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block w-44 shrink-0 snap-start overflow-hidden rounded-md border border-line-subtle bg-bg-elevated transition-shadow hover:shadow-lg focus-visible:focus-ring"
    >
      <div className="aspect-square overflow-hidden">
        <div className="size-full transition-transform duration-300 group-hover:scale-105">
          <ProductMedia product={product} />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="line-clamp-2 text-xs font-semibold text-ink-primary">
          {product.name}
        </p>
        <p className="text-sm font-semibold text-ink-primary tabular-nums">
          {formatPrice(product.price)}
        </p>
        <Badge tone={stock.tone} className="self-start text-[10px]">
          {stock.text}
        </Badge>
      </div>
    </Link>
  );
}

function ArrowBtn({ onClick, dir }) {
  const Icon = dir === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Scroll left' : 'Scroll right'}
      className="grid size-9 place-items-center rounded-full border border-line-subtle bg-bg-elevated text-ink-secondary transition-colors hover:border-line-strong hover:text-ink-primary focus-visible:focus-ring"
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
