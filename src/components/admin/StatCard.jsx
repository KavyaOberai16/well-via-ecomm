import { cn } from '@/lib/utils.js';

const TONES = {
  accent: 'bg-accent/15 text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

/** Dashboard metric tile — icon, value, label. */
export function StatCard({ icon: Icon, label, value, tone = 'accent', loading = false }) {
  return (
    <div className="rounded-lg border border-line-subtle bg-bg-elevated p-5 shadow-md">
      <span className={cn('grid size-10 place-items-center rounded-sm', TONES[tone])}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-h2 text-ink-primary tabular-nums">
        {loading ? '—' : value}
      </p>
      <p className="mt-0.5 text-sm text-ink-secondary">{label}</p>
    </div>
  );
}
