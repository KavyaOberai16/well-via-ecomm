import { cn } from '@/lib/utils.js';

/**
 * Loading placeholder. Match the final layout's dimensions to keep CLS = 0.
 * Shimmer is a <= 1.4s loop (the only permitted infinite animation).
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative overflow-hidden rounded-sm bg-fill',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-shimmer',
        'after:bg-gradient-to-r after:from-transparent after:via-fill-strong after:to-transparent',
        className,
      )}
      {...props}
    />
  );
}
