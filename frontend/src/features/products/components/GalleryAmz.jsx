import { useState } from 'react';
import { cn } from '@/lib/utils.js';
import { ProductMedia } from './ProductMedia.jsx';

/**
 * Amazon-style product image gallery.
 *
 * Layout: a vertical strip of thumbnails on the left, a large image on the
 * right that swaps on thumbnail hover/click. On mobile the thumbs drop to a
 * horizontal row beneath the main image.
 *
 * Hovering the main image enables a circular zoom lens (skipped on touch).
 */
export function GalleryAmz({ product }) {
  const sorted = [...(product.images || [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position,
  );
  const [active, setActive] = useState(0);

  // No images at all — fall back to the gradient placeholder.
  if (sorted.length === 0) {
    return (
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="hidden lg:block lg:w-14 lg:shrink-0" />
        <div className="aspect-square w-full overflow-hidden rounded-md border border-line-subtle bg-bg-elevated">
          <ProductMedia product={product} eager />
        </div>
      </div>
    );
  }

  const current = sorted[Math.min(active, sorted.length - 1)];

  return (
    <div className="flex flex-col-reverse gap-3 lg:flex-row">
      {/* Thumbnail strip */}
      <div
        className={cn(
          'flex shrink-0 gap-2 overflow-x-auto lg:w-14 lg:flex-col lg:overflow-visible',
        )}
        aria-label="Product images"
      >
        {sorted.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            aria-current={i === active}
            className={cn(
              'size-14 shrink-0 overflow-hidden rounded-sm border transition-colors focus-visible:focus-ring',
              i === active
                ? 'border-accent ring-1 ring-accent/40'
                : 'border-line-subtle hover:border-line-strong',
            )}
          >
            <img src={img.url} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div className="flex-1">
        <div className="group relative aspect-square w-full overflow-hidden rounded-md border border-line-subtle bg-bg-elevated">
          <img
            src={current.url}
            alt={product.name}
            fetchpriority="high"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <p className="mt-2 text-center text-xs text-ink-tertiary">
          Hover an image to preview · click to select
        </p>
      </div>
    </div>
  );
}
