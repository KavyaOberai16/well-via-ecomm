import { cn } from '@/lib/utils.js';

/**
 * Product image with a graceful gradient fallback when no image_url is set.
 * Always renders inside a fixed-aspect box so CLS stays 0.
 */
export function ProductMedia({ product, className, eager = false }) {
  const initial = (product?.name || '?').trim().charAt(0).toUpperCase();

  if (product?.image_url) {
    return (
      <img
        src={product.image_url}
        alt={product.name}
        loading={eager ? 'eager' : 'lazy'}
        fetchpriority={eager ? 'high' : undefined}
        decoding="async"
        className={cn('size-full object-cover', className)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid size-full place-items-center bg-gradient-to-br from-accent/25 via-bg-elevated to-bg-sunken',
        className,
      )}
    >
      <span className="text-5xl font-semibold text-ink-primary/30">{initial}</span>
    </div>
  );
}
