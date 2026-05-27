import { cn } from '@/lib/utils.js';

/**
 * Amazon-style 5-bar histogram. Rows ordered 5★ on top down to 1★.
 *
 * Props:
 *   distribution — { "1": n, "2": n, "3": n, "4": n, "5": n }
 *   total        — total review count (used to compute percentages)
 *   onRowClick   — optional. Called with the star number when a row is clicked
 *                  (useful for filtering reviews by star).
 */
export function RatingHistogram({ distribution, total, onRowClick, className }) {
  const safeTotal = Number(total) || 0;
  const dist = distribution || {};

  return (
    <ul className={cn('flex flex-col gap-1.5', className)}>
      {[5, 4, 3, 2, 1].map((star) => {
        const count = Number(dist[String(star)] || 0);
        const pct = safeTotal > 0 ? Math.round((count / safeTotal) * 100) : 0;
        const Row = onRowClick ? 'button' : 'div';
        return (
          <li key={star}>
            <Row
              {...(onRowClick && {
                type: 'button',
                onClick: () => onRowClick(star),
              })}
              className={cn(
                'flex w-full items-center gap-3 text-sm text-ink-secondary',
                onRowClick &&
                  'rounded-sm hover:text-ink-primary focus-visible:focus-ring text-left',
              )}
            >
              <span className="shrink-0 tabular-nums">
                {star} star{star === 1 ? '' : 's'}
              </span>
              <span className="relative block h-2.5 flex-1 overflow-hidden rounded-full bg-fill">
                <span
                  className="absolute inset-y-0 left-0 bg-warning transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ink-tertiary">
                {pct}%
              </span>
            </Row>
          </li>
        );
      })}
    </ul>
  );
}
