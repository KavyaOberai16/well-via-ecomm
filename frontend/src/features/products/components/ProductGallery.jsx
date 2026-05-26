import { useState } from 'react';
import { cn } from '@/lib/utils.js';
import { ProductMedia } from './ProductMedia.jsx';

/**
 * Product detail image gallery — a large main image plus a thumbnail strip.
 * Falls back to the single ProductMedia (gradient or image_url) when the
 * product has no uploaded images.
 */
export function ProductGallery({ product }) {
  const images = [...(product.images || [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  );
  const [active, setActive] = useState(0);

  const cardClass =
    'overflow-hidden rounded-lg border border-line-subtle bg-bg-elevated shadow-lg';

  if (images.length === 0) {
    return (
      <div className={cardClass}>
        <div className="aspect-[4/5]">
          <ProductMedia product={product} eager />
        </div>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className={cardClass}>
        <div className="aspect-[4/5]">
          <img
            src={current.url}
            alt={product.name}
            className="size-full object-cover"
            fetchpriority="high"
          />
        </div>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                'aspect-square overflow-hidden rounded-sm border transition-colors focus-visible:focus-ring',
                i === active
                  ? 'border-accent'
                  : 'border-line-subtle hover:border-line-strong',
              )}
            >
              <img src={img.url} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
