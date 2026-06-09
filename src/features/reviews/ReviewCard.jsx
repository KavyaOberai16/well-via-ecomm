import { CheckCircle2 } from 'lucide-react';
import { StarRating } from './StarRating.jsx';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Single review card. Used on the product detail page and (read-only) inside
 * the admin moderation list.
 */
export function ReviewCard({ review }) {
  if (!review) return null;
  return (
    <article className="border-t border-line-subtle py-5 first:border-t-0 first:pt-0">
      {/* Author row */}
      <div className="flex items-center gap-2 text-sm">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
          {(review.author_display || '?').charAt(0).toUpperCase()}
        </span>
        <span className="font-medium text-ink-primary">{review.author_display}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StarRating value={review.rating} size="sm" />
        {review.title && (
          <h3 className="text-sm font-semibold text-ink-primary">{review.title}</h3>
        )}
      </div>

      <p className="mt-1 text-xs text-ink-tertiary">
        Reviewed on {formatDate(review.created_at)}
        {review.is_verified_purchase && (
          <>
            <span className="mx-1.5 text-ink-tertiary">·</span>
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Verified purchase
            </span>
          </>
        )}
      </p>

      {review.body && (
        <p className="mt-3 whitespace-pre-line text-sm text-ink-primary">{review.body}</p>
      )}
    </article>
  );
}
