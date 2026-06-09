import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils.js';

/** Labeled native select. Mirrors Input's states; helper/error reserve height. */
export const Select = forwardRef(function Select(
  { className, label, helper, error, id, children, ...props },
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
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={helper || error ? describedById : undefined}
          className={cn(
            'h-11 w-full appearance-none rounded-sm bg-bg-sunken pl-3.5 pr-10 text-sm text-ink-primary',
            'border border-line-subtle transition-colors duration-200',
            'hover:border-line-strong',
            'focus-visible:border-accent focus-visible:focus-ring',
            'disabled:opacity-40 disabled:pointer-events-none',
            error && 'border-danger focus-visible:border-danger',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
          aria-hidden="true"
        />
      </div>
      <p
        id={describedById}
        className={cn('min-h-[1.25rem] text-xs', error ? 'text-danger' : 'text-ink-tertiary')}
      >
        {error || helper || ''}
      </p>
    </div>
  );
});
