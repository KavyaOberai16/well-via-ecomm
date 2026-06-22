import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useAuthStore } from '@/features/auth/store.js';
import {
  useAddToWishlist,
  useIsInWishlist,
  useRemoveFromWishlist,
} from './hooks.js';

/**
 * Reusable heart button. Two visual variants:
 *
 * - "overlay" — circular, glassy, semi-transparent. Sits over product imagery
 *   (e.g. top-right of a ProductCard). Stops link navigation on click.
 *
 * - "inline" — flat row with a label, used inside panels like BuyBox.
 *
 * Signed-out users are bounced to /login with a `next` param back to the page
 * they came from. We never silently fail.
 */
export function WishlistButton({
  productId,
  variant = 'overlay',
  size = 'md',
  className,
  redirectTo,
}) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSaved = useIsInWishlist(productId);
  const add = useAddToWishlist();
  const remove = useRemoveFromWishlist();

  const pending = add.isPending || remove.isPending;

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      const next = redirectTo || window.location.pathname + window.location.search;
      navigate(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (isSaved) remove.mutate(productId);
    else add.mutate(productId);
  }

  const label = isSaved ? 'Remove from wishlist' : 'Save to wishlist';

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSaved}
        aria-label={label}
        disabled={pending}
        className={cn(
          'inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-line-subtle bg-bg-sunken text-sm font-medium transition-colors',
          'hover:border-line-strong focus-visible:focus-ring',
          'disabled:opacity-50 disabled:pointer-events-none',
          isSaved ? 'text-danger' : 'text-ink-secondary hover:text-ink-primary',
          className,
        )}
      >
        <Heart
          className={cn('size-4 transition-transform', isSaved && 'fill-current')}
          aria-hidden="true"
        />
        {isSaved ? 'Saved to wishlist' : 'Save to wishlist'}
      </button>
    );
  }

  // overlay — circular glass button
  const sizeClass = size === 'sm' ? 'size-8' : 'size-9';
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSaved}
      aria-label={label}
      disabled={pending}
      className={cn(
        'grid place-items-center rounded-full',
        'bg-bg-elevated/85 backdrop-blur border border-line-subtle shadow-sm',
        'transition-[transform,background-color,color] duration-150',
        'hover:-translate-y-px focus-visible:focus-ring',
        'disabled:opacity-60 disabled:pointer-events-none',
        isSaved
          ? 'text-danger hover:bg-danger/10'
          : 'text-ink-secondary hover:text-ink-primary',
        sizeClass,
        className,
      )}
    >
      <Heart
        className={cn(
          size === 'sm' ? 'size-4' : 'size-[18px]',
          'transition-transform',
          isSaved && 'fill-current',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
