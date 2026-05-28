import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingBag,
  Truck,
  ChevronDown,
  ChevronUp,
  Undo2,
  Banknote,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient.js';
import { Page } from '@/components/layout/Page.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useAuthStore } from '@/features/auth/store.js';
import RequestReturnModal from '@/features/returns/components/RequestReturnModal.jsx';
import { useMyReturns } from '@/features/returns/hooks.js';
import { formatPrice } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

const RETURN_STATUS_TONE = {
  requested: 'bg-warning/15 text-warning',
  approved: 'bg-accent/15 text-accent',
  rejected: 'bg-danger/15 text-danger',
  picked_up: 'bg-blue-500/15 text-blue-400',
  received: 'bg-blue-500/15 text-blue-400',
  refunded: 'bg-success/15 text-success',
  cancelled: 'bg-ink-tertiary/15 text-ink-tertiary',
};

function formatEventTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function humanize(status) {
  return (status || '').replace(/_/g, ' ');
}

const EVENT_TONES = {
  delivered: 'text-success',
  out_for_delivery: 'text-accent',
  in_transit: 'text-blue-400',
  picked_up: 'text-blue-400',
  created: 'text-ink-tertiary',
  returned: 'text-warning',
  failed: 'text-warning',
  cancelled: 'text-danger',
};

function TrackingDisclosure({ order }) {
  const [open, setOpen] = useState(false);
  if (!order.shipping_awb) return null;
  const events = order.tracking_events || [];

  return (
    <div className="mt-3 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-1.5 text-xs">
          <Truck className="size-3.5 text-ink-tertiary" aria-hidden="true" />
          <span className="text-ink-secondary">Tracking</span>
          <span className="font-mono text-[10px] text-ink-tertiary">
            {order.shipping_awb}
          </span>
        </span>
        {open ? (
          <ChevronUp className="size-3.5 text-ink-tertiary" />
        ) : (
          <ChevronDown className="size-3.5 text-ink-tertiary" />
        )}
      </button>
      {open && (
        <div className="mt-2">
          {events.length === 0 ? (
            <p className="text-xs text-ink-tertiary">
              No updates yet from the carrier.
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {[...events]
                .sort((a, b) =>
                  (b.occurred_at || '').localeCompare(a.occurred_at || ''),
                )
                .map((e, i) => (
                  <li
                    key={`${e.status}-${e.occurred_at}-${i}`}
                    className="text-xs"
                  >
                    <span
                      className={`font-semibold capitalize ${EVENT_TONES[e.status] || 'text-ink-secondary'}`}
                    >
                      {humanize(e.status)}
                    </span>
                    <span className="text-ink-tertiary">
                      {' · '}
                      {formatEventTime(e.occurred_at)}
                      {e.location ? ` · ${e.location}` : ''}
                    </span>
                  </li>
                ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

const STATUS_TONES = {
  paid: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  shipped: 'bg-accent/15 text-accent',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-danger/15 text-danger',
  refunded: 'bg-ink-tertiary/15 text-ink-tertiary',
};

function useMyOrders() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => apiClient.get('/orders').then((r) => r.data),
    enabled: !!token,
    retry: false,
  });
}

function ReturnsSummary() {
  const { data: returns, isLoading } = useMyReturns();
  if (isLoading) return null;
  if (!returns || returns.length === 0) return null;
  return (
    <Card className="mt-8 p-5">
      <h2 className="flex items-center gap-2 text-h3 text-ink-primary">
        <Undo2 className="size-4 text-accent" aria-hidden="true" /> Your returns
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {returns.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-1 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-ink-primary">
                Return #{r.id} · Order #{r.order_id}
              </p>
              <p className="text-[11px] text-ink-tertiary">
                {r.reason.replace(/_/g, ' ')} · requested{' '}
                {new Date(r.requested_at).toLocaleDateString()}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                RETURN_STATUS_TONE[r.status] || 'bg-fill text-ink-tertiary'
              }`}
            >
              {r.status.replace(/_/g, ' ')}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useMyOrders();
  const orders = data ?? [];
  // The "Request return" modal: when set, it holds the full order object.
  const [returnOrder, setReturnOrder] = useState(null);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Page>
      <h1 className="text-h1 text-ink-primary">Your orders</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        Everything you&apos;ve bought, newest first.
      </p>

      {isLoading ? (
        <div className="mt-6 grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Once you place an order it will show up here."
            action={
              <Link to="/products">
                <Button size="sm">
                  <ShoppingBag className="size-4" aria-hidden="true" />
                  Start shopping
                </Button>
              </Link>
            }
          />
        </div>
      ) : (
        <motion.ul
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="show"
          className="mt-6 flex flex-col gap-3"
        >
          {orders.map((o) => {
            const tone = STATUS_TONES[o.status] ?? 'bg-fill text-ink-secondary';
            return (
              <motion.li key={o.id} variants={fadeUp}>
                <Card className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-ink-tertiary">
                        Order #{o.id}
                      </p>
                      <p className="mt-1 text-sm text-ink-primary">
                        {o.items.length} item{o.items.length === 1 ? '' : 's'} ·{' '}
                        <strong>{formatPrice(o.total_amount, o.currency)}</strong>
                      </p>
                      <p className="mt-1 text-xs text-ink-tertiary">
                        Placed {new Date(o.created_at).toLocaleString()}
                      </p>
                      {o.shipping_address && (
                        <p className="mt-1 truncate text-xs text-ink-secondary">
                          Shipping to: {o.shipping_address}
                        </p>
                      )}
                      {o.payment_method === 'cod' && Number(o.cod_balance) > 0 &&
                        o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'refunded' && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warning">
                            <Banknote className="size-3.5" aria-hidden="true" />
                            Pay {formatPrice(o.cod_balance, o.currency)} on delivery
                          </p>
                        )}
                    </div>
                    <span
                      className={`shrink-0 self-start rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <TrackingDisclosure order={o} />
                  {o.status === 'delivered' && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReturnOrder(o)}
                      >
                        <Undo2 className="size-4" /> Request return
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      <ReturnsSummary />

      {returnOrder && (
        <RequestReturnModal
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
        />
      )}
    </Page>
  );
}
