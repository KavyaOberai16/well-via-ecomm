import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { cn, formatPrice } from '@/lib/utils.js';
import { useAdminOrders } from '@/features/admin-orders/hooks.js';

const PAGE_SIZE = 25;

const STATUSES = [
  { value: '',          label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'paid',      label: 'Paid' },
  { value: 'shipped',   label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded',  label: 'Refunded' },
];

const STATUS_CLASS = {
  pending:   'bg-fill text-ink-secondary',
  paid:      'bg-accent/15 text-accent',
  shipped:   'bg-blue-500/15 text-blue-400',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-warning/15 text-warning',
  refunded:  'bg-danger/15 text-danger',
};

function useDebounced(v, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
        STATUS_CLASS[status] || 'bg-fill text-ink-secondary',
      )}
    >
      {status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search, 250);

  useEffect(() => setPage(1), [debounced, status]);

  const opts = useMemo(
    () => ({
      q: debounced || undefined,
      status: status || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    [debounced, status, page],
  );

  const { data, isLoading, isError, refetch } = useAdminOrders(opts);
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const counts = data?.counts_by_status || {};

  return (
    <AdminPage
      title="Orders"
      description={`${total.toLocaleString()} order${total === 1 ? '' : 's'} — track fulfillment, issue refunds, and follow the customer journey.`}
    >
      {/* Status chips — clickable filters that double as a glanceable summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const count = s.value ? counts[s.value] : total;
          const active = status === s.value;
          return (
            <button
              key={s.value || 'all'}
              type="button"
              onClick={() => setStatus(s.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors focus-visible:focus-ring',
                active
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-line-subtle bg-bg-elevated text-ink-secondary hover:border-line-strong hover:text-ink-primary',
              )}
            >
              {s.label}
              {count != null && (
                <span className="rounded-full bg-bg-sunken px-1.5 text-[10px] font-medium text-ink-tertiary">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mb-4 max-w-md">
        <Input
          icon={Search}
          placeholder="Search by order # or customer email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError ? (
        <EmptyState
          icon={Package}
          title="Couldn't load orders"
          description="Try again."
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search || status ? 'No orders match your filters' : 'No orders yet'}
          description={
            search || status
              ? 'Try clearing a filter or searching for a different term.'
              : 'Once customers place orders they appear here.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="border-t border-line-subtle">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${o.id}`}
                        className="font-mono text-sm font-medium text-accent hover:underline"
                      >
                        #{o.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-primary">
                      {o.customer_email}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
                      {o.item_count}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums text-ink-primary">
                      {formatPrice(o.total_amount, o.currency)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-tertiary">
                      {formatDate(o.created_at)}
                    </td>
                  </tr>
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
                aria-label="Previous"
                className="grid size-9 place-items-center rounded-sm border border-line-subtle text-ink-secondary hover:bg-fill focus-visible:focus-ring disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next"
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
