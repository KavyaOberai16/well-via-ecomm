import { cn } from '@/lib/utils.js';

/** Elevated surface card. Use `glass` prop for translucent over-media surfaces. */
export function Card({ className, glass = false, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg',
        glass
          ? 'glass'
          : 'border border-line-subtle bg-bg-elevated shadow-md',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}
