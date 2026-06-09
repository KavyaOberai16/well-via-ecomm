import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Search,
  X,
  CheckCircle2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Textarea } from '@/components/ui/Textarea.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn } from '@/lib/utils.js';
import { StarRating } from '@/features/reviews/StarRating.jsx';
import {
  useAdminReviews,
  useAdminCreateReview,
  useAdminUpdateReview,
  useAdminDeleteReview,
} from '@/features/reviews/hooks.js';
import { useProducts } from '@/features/products/hooks.js';

const PAGE_SIZE = 25;

const EMPTY_FORM = {
  product_id: null,
  productName: '',  // for display only
  rating: 5,
  author_name: '',
  title: '',
  body: '',
  is_verified_purchase: false,
  is_approved: true,
};

function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ---- Product picker (search by name, click to select) ----

function ProductPicker({ value, valueName, onChange, disabled, error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const debouncedQ = useDebounced(q, 200);
  const { data, isLoading } = useProducts({ q: debouncedQ || undefined, page: 1, page_size: 8 });
  const items = data?.items || [];

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink-secondary">Product</label>
        <div className="flex items-center gap-2 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2.5">
          <span className="flex-1 truncate text-sm text-ink-primary">{valueName}</span>
          <span className="font-mono text-xs text-ink-tertiary">#{value}</span>
          <button
            type="button"
            aria-label="Clear product"
            disabled={disabled}
            onClick={() => onChange(null, '')}
            className="grid size-7 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring disabled:opacity-50"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <p className="min-h-[1.25rem] text-xs text-ink-tertiary">
          Click × to pick a different product.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink-secondary">Product</label>
      <div className="relative">
        <Input
          icon={Search}
          placeholder="Search by name…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          error={error}
          className="!h-11"
        />
        {open && q.trim().length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-sm border border-line-subtle bg-bg-elevated shadow-lg">
            {isLoading ? (
              <li className="px-3 py-2 text-xs text-ink-tertiary">Searching…</li>
            ) : items.length === 0 ? (
              <li className="px-3 py-2 text-xs text-ink-tertiary">No matches.</li>
            ) : (
              items.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(p.id, p.name);
                      setOpen(false);
                      setQ('');
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-fill focus-visible:focus-ring"
                  >
                    <span className="truncate text-ink-primary">{p.name}</span>
                    <span className="font-mono text-xs text-ink-tertiary">{p.sku}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---- Create / edit form ----

function ReviewForm({ initial, mode, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [error, setError] = useState(null);
  const create = useAdminCreateReview();
  const update = useAdminUpdateReview();

  useEffect(() => {
    setForm(initial || EMPTY_FORM);
    setError(null);
  }, [initial]);

  const pending = create.isPending || update.isPending;
  const isEdit = mode === 'edit';

  function set(k) {
    return (e) => {
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [k]: v }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!isEdit && !form.product_id) {
      setError('Pick a product first.');
      return;
    }
    if (!form.rating || form.rating < 1 || form.rating > 5) {
      setError('Rating must be 1–5.');
      return;
    }
    if (!isEdit && !form.author_name.trim() && !form.user_id) {
      setError('Author name is required when no user account is linked.');
      return;
    }

    const payload = {
      rating: Number(form.rating),
      author_name: form.author_name.trim() || null,
      title: form.title.trim() || null,
      body: form.body.trim() || null,
      is_verified_purchase: !!form.is_verified_purchase,
      is_approved: !!form.is_approved,
    };

    try {
      if (isEdit && initial?.id) {
        await update.mutateAsync({ reviewId: initial.id, data: payload });
      } else {
        await create.mutateAsync({ ...payload, product_id: form.product_id });
      }
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save the review.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-line-subtle bg-bg-elevated p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-h3 text-ink-primary">
          {isEdit ? 'Edit review' : 'New review'}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Product picker (create only — editing locks the product) */}
        {!isEdit ? (
          <ProductPicker
            value={form.product_id}
            valueName={form.productName}
            onChange={(id, name) =>
              setForm((f) => ({ ...f, product_id: id, productName: name }))
            }
            disabled={pending}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink-secondary">Product</label>
            <div className="flex h-11 items-center rounded-sm border border-line-subtle bg-bg-sunken px-3 text-sm text-ink-primary">
              {form.productName}
              <span className="ml-auto font-mono text-xs text-ink-tertiary">
                #{form.product_id}
              </span>
            </div>
            <p className="min-h-[1.25rem] text-xs text-ink-tertiary">
              Product cannot be changed after creation.
            </p>
          </div>
        )}

        <Input
          label="Author name"
          placeholder="Priya R."
          value={form.author_name}
          onChange={set('author_name')}
          helper="Shown publicly. Used when no user account is linked."
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink-secondary">Rating</label>
          <div className="flex h-11 items-center">
            <StarRating
              value={Number(form.rating) || 0}
              onChange={(n) => setForm((f) => ({ ...f, rating: n }))}
              size="lg"
            />
          </div>
          <p className="min-h-[1.25rem] text-xs text-ink-tertiary">
            Tap a star (1–5).
          </p>
        </div>

        <Input
          label="Headline (optional)"
          placeholder="Sums up the review"
          value={form.title}
          onChange={set('title')}
          maxLength={160}
        />
      </div>

      <div className="mt-1">
        <Textarea
          label="Body (optional)"
          placeholder="Detailed review body"
          value={form.body}
          onChange={set('body')}
          rows={4}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-secondary">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_verified_purchase}
            onChange={set('is_verified_purchase')}
            className="size-4 rounded-sm border border-line-subtle bg-bg-sunken text-accent focus-visible:focus-ring"
          />
          Verified purchase
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.is_approved}
            onChange={set('is_approved')}
            className="size-4 rounded-sm border border-line-subtle bg-bg-sunken text-accent focus-visible:focus-ring"
          />
          Approved (visible publicly)
        </label>
      </div>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {isEdit ? 'Save changes' : 'Create review'}
        </Button>
      </div>
    </form>
  );
}

// ---- List row ----

function ReviewRow({ review, onEdit }) {
  const update = useAdminUpdateReview();
  const del = useAdminDeleteReview();
  const [confirming, setConfirming] = useState(false);

  const pending = update.isPending || del.isPending;

  function toggleApproved() {
    update.mutate({
      reviewId: review.id,
      data: { is_approved: !review.is_approved },
    });
  }

  return (
    <tr className="border-t border-line-subtle">
      <td className="px-4 py-3">
        <Link
          to={`/products/${review.product_id}`}
          className="text-sm font-medium text-accent hover:underline"
        >
          #{review.product_id}
        </Link>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} size="sm" />
          <span className="text-xs tabular-nums text-ink-tertiary">{review.rating}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-ink-primary">{review.author_display}</p>
        {review.is_verified_purchase && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-success">
            <CheckCircle2 className="size-3" /> Verified
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        {review.title && (
          <p className="line-clamp-1 text-sm font-medium text-ink-primary">
            {review.title}
          </p>
        )}
        {review.body && (
          <p className="line-clamp-2 text-xs text-ink-secondary">{review.body}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={review.is_approved}
          aria-label={review.is_approved ? 'Unapprove' : 'Approve'}
          disabled={pending}
          onClick={toggleApproved}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            'focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none',
            review.is_approved ? 'bg-accent' : 'bg-fill-strong',
          )}
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              review.is_approved ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {confirming ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                loading={del.isPending}
                onClick={() =>
                  del.mutate(
                    { reviewId: review.id, productId: review.product_id },
                    { onSuccess: () => setConfirming(false) },
                  )
                }
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={del.isPending}
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                aria-label="Edit review"
                disabled={pending}
                onClick={() => onEdit(review)}
                className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Delete review"
                disabled={pending}
                onClick={() => setConfirming(true)}
                className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---- Page ----

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 250);
  const [ratingFilter, setRatingFilter] = useState('');
  const [approvedFilter, setApprovedFilter] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | review object

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, ratingFilter, approvedFilter]);

  const queryOpts = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      rating: ratingFilter ? Number(ratingFilter) : undefined,
      approved:
        approvedFilter === '' ? undefined : approvedFilter === 'true',
      page,
      page_size: PAGE_SIZE,
    }),
    [debouncedSearch, ratingFilter, approvedFilter, page],
  );

  const { data, isLoading, isError, refetch } = useAdminReviews(queryOpts);
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const isFormOpen = editing !== null;
  // For edit, we need productName too — but the row doesn't carry it. We do a
  // best-effort: leave it blank if missing; the form locks the product anyway.
  const formInitial =
    editing && editing !== 'new'
      ? {
          id: editing.id,
          product_id: editing.product_id,
          productName: `Product #${editing.product_id}`,
          rating: editing.rating,
          author_name: editing.author_display || '',
          title: editing.title || '',
          body: editing.body || '',
          is_verified_purchase: editing.is_verified_purchase,
          is_approved: editing.is_approved,
        }
      : null;

  return (
    <AdminPage
      title="Reviews"
      description={
        isLoading
          ? 'Loading…'
          : `${total} review${total === 1 ? '' : 's'} — entered ratings show up on the product detail page.`
      }
      action={
        !isFormOpen && (
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden="true" />
            New review
          </Button>
        )
      }
    >
      {isFormOpen && (
        <ReviewForm
          mode={editing === 'new' ? 'create' : 'edit'}
          initial={formInitial}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {/* Filters */}
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_140px_160px]">
        <Input
          icon={Search}
          placeholder="Search title, body, or author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
          <option value="">All ratings</option>
          <option value="5">★ 5 only</option>
          <option value="4">★ 4 only</option>
          <option value="3">★ 3 only</option>
          <option value="2">★ 2 only</option>
          <option value="1">★ 1 only</option>
        </Select>
        <Select value={approvedFilter} onChange={(e) => setApprovedFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="true">Approved only</option>
          <option value="false">Unapproved only</option>
        </Select>
      </div>

      {isError ? (
        <EmptyState
          icon={Star}
          title="Couldn't load reviews"
          description="Something went wrong. Please try again."
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={
            search || ratingFilter || approvedFilter
              ? 'No reviews match those filters'
              : 'No reviews yet'
          }
          description={
            search || ratingFilter || approvedFilter
              ? 'Try clearing a filter.'
              : 'Use "New review" to seed your first one.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                  <th className="px-4 py-3 font-medium">Approved</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <ReviewRow key={r.id} review={r} onEdit={setEditing} />
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <span className="text-xs text-ink-tertiary">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                className="grid size-9 place-items-center rounded-sm border border-line-subtle text-ink-secondary hover:bg-fill focus-visible:focus-ring disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                className="grid size-9 place-items-center rounded-sm border border-line-subtle text-ink-secondary hover:bg-fill focus-visible:focus-ring disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </AdminPage>
  );
}
