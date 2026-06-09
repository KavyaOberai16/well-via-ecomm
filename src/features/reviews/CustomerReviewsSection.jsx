import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, PencilLine, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { cn } from '@/lib/utils.js';
import { useAuthStore } from '@/features/auth/store.js';
import { useProductReviews } from './hooks.js';
import { StarRating } from './StarRating.jsx';
import { RatingHistogram } from './RatingHistogram.jsx';
import { ReviewCard } from './ReviewCard.jsx';
import { WriteReviewForm } from './WriteReviewForm.jsx';

const PAGE_SIZE = 10;

/**
 * Full Amazon-style customer reviews section. Two-column layout on >=lg:
 *   - Left rail: aggregate (stars + count + histogram + write-review button)
 *   - Right rail: sort + paginated reviews
 *
 * Stacks vertically on smaller screens.
 */
export function CustomerReviewsSection({ product }) {
  const user = useAuthStore((s) => s.user);
  const [sort, setSort] = useState('top');
  const [page, setPage] = useState(1);
  const [writing, setWriting] = useState(false);

  const { data, isLoading } = useProductReviews(product.id, {
    page,
    page_size: PAGE_SIZE,
    sort,
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const ratingAvg = Number(product.rating_avg) || 0;
  const ratingCount = Number(product.rating_count) || 0;
  const distribution =
    product.rating_distribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

  // Has this signed-in user already left a review? They show in the list with
  // their user_id. We compare to disable the write-button.
  const userReviewed = !!user && items.some((r) => r.user_id === user.id);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="mt-12 border-t border-line-subtle pt-10"
    >
      <h2 id="reviews-heading" className="text-h2 text-ink-primary">
        Customer reviews
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Left rail — aggregate */}
        <aside aria-label="Rating summary">
          {ratingCount === 0 ? (
            <p className="text-sm text-ink-secondary">
              No reviews yet. Be the first to share your thoughts.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <StarRating value={ratingAvg} size="lg" />
                <p className="text-lg font-semibold text-ink-primary tabular-nums">
                  {ratingAvg.toFixed(1)}
                  <span className="text-sm font-normal text-ink-tertiary"> out of 5</span>
                </p>
              </div>
              <p className="mt-1 text-xs text-ink-secondary">
                {ratingCount.toLocaleString()} global rating{ratingCount === 1 ? '' : 's'}
              </p>
              <div className="mt-5">
                <RatingHistogram distribution={distribution} total={ratingCount} />
              </div>
            </>
          )}

          <div className="mt-6 border-t border-line-subtle pt-5">
            <p className="text-sm font-medium text-ink-primary">Review this product</p>
            <p className="mt-1 text-xs text-ink-tertiary">
              Share your thoughts with other customers.
            </p>
            {!user ? (
              <Link to={`/login?next=/products/${product.id}`} className="mt-3 inline-block">
                <Button size="sm" variant="secondary" className="w-full">
                  Sign in to write a review
                </Button>
              </Link>
            ) : userReviewed ? (
              <p className="mt-3 text-xs text-ink-tertiary">
                You&apos;ve already reviewed this product.
              </p>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => setWriting(true)}
                disabled={writing}
              >
                <PencilLine className="size-4" aria-hidden="true" />
                Write a customer review
              </Button>
            )}
          </div>
        </aside>

        {/* Right rail — reviews */}
        <div className="min-w-0">
          {writing && (
            <WriteReviewForm
              productId={product.id}
              onCancel={() => setWriting(false)}
              onSubmitted={() => {
                setWriting(false);
                setSort('newest');
                setPage(1);
              }}
            />
          )}

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-secondary">
              {ratingCount > 0
                ? `Showing ${items.length} of ${total} review${total === 1 ? '' : 's'}`
                : 'No reviews yet'}
            </p>
            <SortMenu value={sort} onChange={(v) => { setSort(v); setPage(1); }} />
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line-subtle py-12 text-center">
                <MessageSquare className="size-6 text-ink-tertiary" aria-hidden="true" />
                <p className="text-sm text-ink-secondary">No reviews yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line-subtle">
                {items.map((r) => (
                  <li key={r.id}>
                    <ReviewCard review={r} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-ink-tertiary">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SortMenu({ value, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-xs text-ink-secondary">
      Sort by
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-9 appearance-none rounded-sm border border-line-subtle bg-bg-sunken pl-3 pr-8 text-sm text-ink-primary',
            'hover:border-line-strong focus-visible:border-accent focus-visible:focus-ring',
          )}
        >
          <option value="top">Top reviews</option>
          <option value="newest">Most recent</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-ink-tertiary"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}
