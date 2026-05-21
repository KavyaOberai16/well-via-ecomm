import { cn } from '@/lib/utils.js';

/**
 * Empty / error display: icon + one-line message + a clear next action.
 * Never leave a blank region — always render this instead.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-line-subtle bg-bg-elevated px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <span className="grid size-12 place-items-center rounded-full bg-white/5 text-ink-secondary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-h3 text-ink-primary">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-ink-secondary">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
