import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils.js';

/** Labeled multi-line field. Mirrors Input's states; helper/error reserve height. */
export const Textarea = forwardRef(function Textarea(
  { className, label, helper, error, id, rows = 4, ...props },
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={helper || error ? describedById : undefined}
        className={cn(
          'w-full rounded-sm bg-bg-sunken px-3.5 py-2.5 text-sm text-ink-primary',
          'border border-line-subtle placeholder:text-ink-tertiary resize-y',
          'transition-colors duration-200 hover:border-line-strong',
          'focus-visible:border-accent focus-visible:focus-ring',
          'disabled:opacity-40 disabled:pointer-events-none',
          error && 'border-danger focus-visible:border-danger',
          className,
        )}
        {...props}
      />
      <p
        id={describedById}
        className={cn('min-h-[1.25rem] text-xs', error ? 'text-danger' : 'text-ink-tertiary')}
      >
        {error || helper || ''}
      </p>
    </div>
  );
});
