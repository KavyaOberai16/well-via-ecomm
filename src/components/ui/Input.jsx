import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils.js';

/**
 * Labeled form field. The label is persistent and associated — placeholder
 * text is never the only label. Helper/error text reserves height (no CLS).
 */
export const Input = forwardRef(function Input(
  { className, label, helper, error, id, type = 'text', icon: Icon, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id || autoId;
  const describedById = `${fieldId}-desc`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-ink-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={fieldId}
          type={type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={helper || error ? describedById : undefined}
          className={cn(
            'h-11 w-full rounded-sm bg-bg-sunken px-3.5 text-sm text-ink-primary',
            'border border-line-subtle placeholder:text-ink-tertiary',
            'transition-colors duration-200',
            'hover:border-line-strong',
            'focus-visible:border-accent focus-visible:focus-ring',
            'disabled:opacity-40 disabled:pointer-events-none',
            Icon && 'pl-10',
            error && 'border-danger focus-visible:border-danger',
            className,
          )}
          {...props}
        />
      </div>
      {/* Reserved line so layout never shifts when an error appears */}
      <p
        id={describedById}
        className={cn('min-h-[1.25rem] text-xs', error ? 'text-danger' : 'text-ink-tertiary')}
      >
        {error || helper || ''}
      </p>
    </div>
  );
});
