import { CheckCircle2 } from 'lucide-react';
import { useProductReviews } from '@/features/reviews/hooks.js';
import { StarRating } from '@/features/reviews/StarRating.jsx';
import { RatingHistogram } from '@/features/reviews/RatingHistogram.jsx';
import { GlassCard, SectionHeading, Reveal } from './luxe.jsx';

/**
 * "What our customers say" — the review showcase from the design mockup.
 *
 * Left: the headline rating (e.g. 4.9), stars, count and the star histogram.
 * Right: a few top reviews as cards with initial-avatars and verified badges.
 *
 * Fed entirely by real review data. Renders nothing when a product has no
 * ratings yet, so it never shows an empty shell. The full, paginated reviews
 * (with the write-a-review flow) still live below in CustomerReviewsSection.
 */
export function CustomerSay({ product }) {
  const ratingAvg = Number(product.rating_avg) || 0;
  const ratingCount = Number(product.rating_count) || 0;

  const { data } = useProductReviews(product.id, {
    page: 1,
    page_size: 6,
    sort: 'top',
  });

  if (ratingCount === 0) return null;

  const distribution =
    product.rating_distribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  const cards = (data?.items || []).filter((r) => r.body).slice(0, 3);

  return (
    <section aria-labelledby="customer-say" className="mt-20">
      <Reveal>
        <SectionHeading
          eyebrow="Loved by customers"
          title="What our customers say"
          className="items-start"
        />
      </Reveal>
      <p id="customer-say" className="sr-only">
        Customer reviews summary
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Rating summary */}
        <Reveal>
          <GlassCard className="flex h-full flex-col justify-center p-6 text-center">
            <p className="text-6xl font-semibold leading-none text-ink-primary tabular-nums">
              {ratingAvg.toFixed(1)}
            </p>
            <div className="mt-3 flex justify-center">
              <StarRating value={ratingAvg} size="lg" />
            </div>
            <p className="mt-2 text-sm text-ink-secondary">
              Based on {ratingCount.toLocaleString()} review
              {ratingCount === 1 ? '' : 's'}
            </p>
            <div className="mt-6 text-left">
              <RatingHistogram distribution={distribution} total={ratingCount} />
            </div>
          </GlassCard>
        </Reveal>

        {/* Review cards */}
        {cards.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.06}>
                <GlassCard className="flex h-full flex-col p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                      {(r.author_display || '?').charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-primary">
                        {r.author_display}
                      </p>
                      {r.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          Verified buyer
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <StarRating value={r.rating} size="sm" />
                  </div>
                  {r.title && (
                    <h3 className="mt-2 text-sm font-semibold text-ink-primary">
                      {r.title}
                    </h3>
                  )}
                  <p className="mt-1.5 line-clamp-5 text-sm leading-relaxed text-ink-secondary">
                    {r.body}
                  </p>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
