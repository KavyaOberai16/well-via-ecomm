import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
    'font-semibold rounded-sm',
    'transition-[transform,background-color,border-color,box-shadow,filter] duration-200',
    'focus-visible:focus-ring',
    'disabled:opacity-40 disabled:pointer-events-none',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-accent text-ink-inverse hover:bg-accent-hover active:bg-accent-press hover:-translate-y-px active:translate-y-0',
        secondary:
          'glass text-ink-primary hover:border-line-strong hover:-translate-y-px active:translate-y-0',
        ghost: 'text-ink-secondary hover:text-ink-primary hover:bg-fill',
        destructive:
          'bg-danger text-white hover:brightness-110 hover:-translate-y-px active:translate-y-0',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-[52px] px-7 text-sm',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export const Button = forwardRef(function Button(
  { className, variant, size, block, loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export { buttonVariants };
