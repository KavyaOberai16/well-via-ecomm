import { Award, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card.jsx';
import { cn } from '@/lib/utils.js';

/**
 * Storefront VIP card. Reads `tier_progress` from /loyalty/me. Renders nothing
 * if the store has no VIP tiers configured yet.
 *
 *   { current: {name, color, earn_multiplier, benefits}, next: ..., points_to_next, progress_pct }
 */
export function VipTierCard({ progress }) {
  if (!progress || (!progress.current && !progress.next)) return null;
  const { current, next, points_to_next, progress_pct } = progress;

  // Accent color drives the badge tint. Falls back to the theme accent when
  // the admin didn't set a hex.
  const badgeColor = current?.color || 'var(--accent)';

  return (
    <Card className="overflow-hidden p-0">
      {/* Color band so the VIP card stands out from the generic balance card. */}
      <div
        className="h-1.5 w-full"
        style={{
          background: badgeColor,
        }}
        aria-hidden="true"
      />
      <div className="grid gap-4 p-6 md:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-tertiary">
            <Award className="size-3.5" aria-hidden="true" />
            Your tier
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-ink-inverse"
              style={{ background: badgeColor }}
              aria-hidden="true"
            >
              <Award className="size-5" />
            </span>
            <div>
              <p className="text-h2 text-ink-primary">
                {current?.name || 'Not yet a member'}
              </p>
              {current && Number(current.earn_multiplier) > 1 && (
                <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-success">
                  <TrendingUp className="size-3" /> {Number(current.earn_multiplier).toFixed(2)}× on every points earn
                </p>
              )}
            </div>
          </div>
          {current?.benefits && (
            <p className="mt-3 text-sm text-ink-secondary">{current.benefits}</p>
          )}
        </div>

        <div className="min-w-0">
          {next ? (
            <>
              <p className="text-xs uppercase tracking-wide text-ink-tertiary">
                Progress to {next.name}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-fill">
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500')}
                  style={{
                    width: `${Math.max(2, Math.min(100, progress_pct || 0))}%`,
                    background: next.color || 'var(--accent)',
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-secondary">
                {points_to_next != null && points_to_next > 0 ? (
                  <>
                    <strong className="text-ink-primary">
                      {points_to_next.toLocaleString()}
                    </strong>{' '}
                    more lifetime pts to {next.name} (
                    {Number(next.earn_multiplier).toFixed(2)}× multiplier)
                  </>
                ) : (
                  <>You&apos;ve reached {next.name}!</>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-ink-secondary">
              You&apos;ve unlocked the highest tier. 🎉
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
