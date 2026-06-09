import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Pencil,
  Mail,
  ShieldCheck,
  Clock,
  CreditCard,
  TicketPercent,
  AlertTriangle,
  Save,
  Send,
  ExternalLink,
  Calendar,
  Printer,
  RefreshCw,
  Activity,
  FlaskConical,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Textarea } from '@/components/ui/Textarea.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn, formatPrice } from '@/lib/utils.js';
import {
  useAdminOrder,
  useCancelOrder,
  useDeliverOrder,
  useMockSimulate,
  usePushToCarrier,
  useRefundOrder,
  useSchedulePickup,
  useShipOrder,
  useSyncTracking,
  useUpdateOrderNotes,
} from '@/features/admin-orders/hooks.js';
import { adminOrdersApi } from '@/features/admin-orders/api.js';

const STATUS_CLASS = {
  pending:   'bg-fill text-ink-secondary',
  paid:      'bg-accent/15 text-accent',
  shipped:   'bg-blue-500/15 text-blue-400',
  delivered: 'bg-success/15 text-success',
  cancelled: 'bg-warning/15 text-warning',
  refunded:  'bg-danger/15 text-danger',
};

function formatDateTime(iso) {
  if (!iso) return '—';
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_CLASS[status] || 'bg-fill text-ink-secondary',
      )}
    >
      {status}
    </span>
  );
}

function Timeline({ order }) {
  // Each row shows a status step. We render gray/inactive for steps the order
  // never reached so admins can see at a glance where the order stalled.
  const rows = [
    { label: 'Placed',    when: order.created_at,   active: true },
    { label: 'Paid',      when: order.paid_at,      active: !!order.paid_at },
    { label: 'Shipped',   when: order.shipped_at,   active: !!order.shipped_at },
    { label: 'Delivered', when: order.delivered_at, active: !!order.delivered_at },
  ];
  if (order.cancelled_at) {
    rows.push({ label: 'Cancelled', when: order.cancelled_at, active: true, tone: 'warning' });
  }
  if (order.refunded_at) {
    rows.push({ label: 'Refunded', when: order.refunded_at, active: true, tone: 'danger' });
  }
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li
          key={r.label}
          className={cn(
            'flex items-center gap-3 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2 text-sm',
            !r.active && 'opacity-40',
          )}
        >
          <Clock className="size-3.5 text-ink-tertiary" aria-hidden="true" />
          <span className="flex-1 text-ink-primary">{r.label}</span>
          <span className="text-xs tabular-nums text-ink-tertiary">
            {formatDateTime(r.when)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ShipForm({ order, onSuccess }) {
  const [tracking, setTracking] = useState(order.tracking_number || '');
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [error, setError] = useState(null);
  const ship = useShipOrder();

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      await ship.mutateAsync({
        id: order.id,
        data: {
          tracking_number: tracking.trim() || null,
          carrier: carrier.trim() || null,
        },
      });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not ship the order.');
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line-subtle bg-bg-elevated p-5">
      <p className="text-sm font-medium text-ink-primary">Mark as shipped</p>
      <p className="mt-0.5 text-xs text-ink-tertiary">
        Optional but recommended: paste the carrier&apos;s tracking number so the
        customer can follow it.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Input
          label="Carrier"
          placeholder="UPS, FedEx, Delhivery…"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
        />
        <Input
          label="Tracking number"
          placeholder="1Z..."
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex justify-end">
        <Button type="submit" loading={ship.isPending}>
          <Truck className="size-4" /> Ship it
        </Button>
      </div>
    </form>
  );
}

function ReasonModal({ title, action, onClose, onSubmit, pending }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <Card className="w-full max-w-md p-6">
        <p className="text-h3 text-ink-primary">{title}</p>
        <p className="mt-1 text-xs text-ink-tertiary">
          A short reason is recorded in the audit log + on the order. The
          customer is not shown this verbatim.
        </p>
        <div className="mt-3">
          <Textarea
            placeholder="Customer requested cancellation; item out of stock; etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={pending}
            onClick={() => {
              if (reason.trim().length < 3) {
                setError('Reason is required.');
                return;
              }
              onSubmit(reason.trim());
            }}
          >
            {action}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Default to tomorrow at 10:00 in the local timezone for the date picker.
function defaultPickupDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  // Format YYYY-MM-DD for <input type="date">.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ShipmentPanel({ order }) {
  const push = usePushToCarrier();
  const schedule = useSchedulePickup();
  const sync = useSyncTracking();
  const [error, setError] = useState(null);
  const [pickupDate, setPickupDate] = useState(defaultPickupDate);
  const [labelLoading, setLabelLoading] = useState(false);

  const hasAwb = !!order.shipping_awb;
  const hasPickup = !!order.pickup_id;
  const canPush = !hasAwb && order.status === 'paid';

  async function handlePush() {
    setError(null);
    try {
      await push.mutateAsync(order.id);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Could not push to carrier.',
      );
    }
  }

  async function handleSchedule() {
    setError(null);
    if (!pickupDate) {
      setError('Pick a date first.');
      return;
    }
    try {
      // Submit at noon UTC of the chosen date — the carrier rounds to a slot
      // anyway, and we just need a deterministic timestamp.
      const iso = new Date(`${pickupDate}T12:00:00Z`).toISOString();
      await schedule.mutateAsync({ id: order.id, pickup_date: iso });
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Could not schedule pickup.',
      );
    }
  }

  async function handleSync() {
    setError(null);
    try {
      await sync.mutateAsync(order.id);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not sync tracking.');
    }
  }

  async function handleLabel() {
    setError(null);
    setLabelLoading(true);
    try {
      const blob = await adminOrdersApi.fetchLabel(order.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      // Defer the revoke so the new tab has time to read the URL. 60s is
      // generous — most browsers latch the resource on document load.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Could not fetch the label.',
      );
    } finally {
      setLabelLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-tertiary">
        <Truck className="size-3.5" /> Carrier shipment
      </p>

      {hasAwb ? (
        <div className="mt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                {order.shipping_provider}
              </span>
              <span className="text-[11px] text-ink-tertiary">
                {formatDateTime(order.shipment_created_at)}
              </span>
            </div>
            <p className="mt-1 break-all font-mono text-xs text-ink-primary">
              {order.shipping_awb}
            </p>
          </div>

          <Button
            size="sm"
            variant="secondary"
            block
            onClick={handleLabel}
            loading={labelLoading}
          >
            <Printer className="size-4" /> Print label
          </Button>

          <div className="border-t border-line-subtle pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
              Pickup
            </p>
            {hasPickup ? (
              <div className="mt-1.5 text-xs text-ink-secondary">
                <p className="font-mono text-ink-primary">{order.pickup_id}</p>
                <p className="mt-0.5 inline-flex items-center gap-1">
                  <Calendar className="size-3" aria-hidden="true" />
                  {formatDateTime(order.pickup_scheduled_for)}
                </p>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={defaultPickupDate()}
                  className="flex-1 rounded-sm border border-line-subtle bg-bg-elevated px-2 py-1 text-xs text-ink-primary focus-visible:focus-ring"
                />
                <Button
                  size="sm"
                  onClick={handleSchedule}
                  loading={schedule.isPending}
                >
                  Schedule
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-line-subtle pt-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
                <Activity className="size-3" /> Tracking
              </p>
              <button
                type="button"
                onClick={handleSync}
                disabled={sync.isPending}
                className="inline-flex items-center gap-1 text-[11px] text-accent hover:underline disabled:opacity-50"
              >
                <RefreshCw className={cn('size-3', sync.isPending && 'animate-spin')} />
                Sync
              </button>
            </div>
            {order.last_tracking_at && (
              <p className="mt-1 text-[10px] text-ink-tertiary">
                Last update {formatDateTime(order.last_tracking_at)}
              </p>
            )}
            <div className="mt-2">
              <TrackingTimeline events={order.tracking_events} />
            </div>
            {order.shipping_provider === 'mock' && <MockSimulator order={order} />}
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      ) : canPush ? (
        <div className="mt-3">
          <p className="text-xs text-ink-secondary">
            Push this order to the active shipping provider to mint a waybill.
          </p>
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          <Button
            size="sm"
            className="mt-3"
            onClick={handlePush}
            loading={push.isPending}
          >
            <Send className="size-4" /> Push to carrier
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink-tertiary">
          {order.status === 'paid'
            ? 'Configure a shipping provider in Settings to push this order.'
            : `Available once the order reaches PAID (currently ${order.status}).`}
        </p>
      )}
    </Card>
  );
}

// Visual mapping of normalized TrackingStatus -> color hint for the bullet.
const TRACKING_TONE = {
  created: 'bg-fill text-ink-tertiary',
  picked_up: 'bg-blue-500/20 text-blue-400',
  in_transit: 'bg-blue-500/20 text-blue-400',
  out_for_delivery: 'bg-accent/20 text-accent',
  delivered: 'bg-success/20 text-success',
  failed: 'bg-warning/20 text-warning',
  returned: 'bg-warning/20 text-warning',
  cancelled: 'bg-danger/20 text-danger',
};

function humanizeStatus(s) {
  return (s || '').replace(/_/g, ' ');
}

function TrackingTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <p className="text-xs text-ink-tertiary">
        No tracking events yet. The carrier will push updates here.
      </p>
    );
  }
  // Most-recent first reads better in a UI even though we store ascending.
  const ordered = [...events].sort((a, b) =>
    (b.occurred_at || '').localeCompare(a.occurred_at || ''),
  );
  return (
    <ol className="flex flex-col gap-1.5">
      {ordered.map((e, i) => (
        <li
          key={`${e.status}-${e.occurred_at}-${i}`}
          className="flex items-start gap-2 rounded-sm border border-line-subtle bg-bg-sunken px-2.5 py-2 text-xs"
        >
          <span
            className={cn(
              'mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              TRACKING_TONE[e.status] || 'bg-fill text-ink-tertiary',
            )}
          >
            {humanizeStatus(e.status)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-ink-primary">{e.note || e.location || '—'}</p>
            <p className="mt-0.5 text-[10px] tabular-nums text-ink-tertiary">
              {formatDateTime(e.occurred_at)}
              {e.location && e.note ? ` · ${e.location}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function MockSimulator({ order }) {
  // Only renders inside ShipmentPanel when shipping_provider === 'mock'.
  const [status, setStatus] = useState('in_transit');
  const sim = useMockSimulate();
  const [error, setError] = useState(null);

  async function fire() {
    setError(null);
    try {
      await sim.mutateAsync({
        id: order.id,
        awb: order.shipping_awb,
        status,
        note: `Simulated ${status}`,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Simulation failed.');
    }
  }

  return (
    <div className="mt-3 rounded-sm border border-dashed border-line-strong bg-bg-elevated px-2.5 py-2">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
        <FlaskConical className="size-3" /> Mock simulator
      </p>
      <div className="mt-2 flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="flex-1 rounded-sm border border-line-subtle bg-bg-sunken px-2 py-1 text-xs text-ink-primary"
        >
          {['picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed'].map(
            (s) => (
              <option key={s} value={s}>
                {humanizeStatus(s)}
              </option>
            ),
          )}
        </select>
        <Button size="sm" variant="secondary" onClick={fire} loading={sim.isPending}>
          Fire
        </Button>
      </div>
      {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
    </div>
  );
}

function NotesPanel({ order }) {
  const [notes, setNotes] = useState(order.internal_notes || '');
  const [savedAt, setSavedAt] = useState(null);
  const update = useUpdateOrderNotes();
  const dirty = (notes || '') !== (order.internal_notes || '');

  async function save() {
    try {
      await update.mutateAsync({ id: order.id, internal_notes: notes });
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 1500);
    } catch (_err) {
      /* mutation surfaces error state */
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-primary">Internal notes</p>
        <p className="text-[11px] text-ink-tertiary">Visible to staff only.</p>
      </div>
      <Textarea
        className="mt-2"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Talk to fulfillment about repackaging; customer prefers…"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-ink-tertiary">
          {savedAt ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 className="size-3.5" /> Saved
            </span>
          ) : dirty ? (
            <span className="text-warning">Unsaved changes</span>
          ) : null}
        </p>
        <Button size="sm" onClick={save} disabled={!dirty} loading={update.isPending}>
          <Save className="size-4" /> Save notes
        </Button>
      </div>
    </Card>
  );
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);
  const { data: order, isLoading, isError } = useAdminOrder(orderId);

  const deliver = useDeliverOrder();
  const cancel = useCancelOrder();
  const refund = useRefundOrder();

  const [modal, setModal] = useState(null); // 'cancel' | 'refund' | null

  if (isLoading) {
    return (
      <AdminPage title="Order">
        <div className="grid gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-48" />
        </div>
      </AdminPage>
    );
  }
  if (isError || !order) {
    return (
      <AdminPage title="Order">
        <EmptyState
          icon={AlertTriangle}
          title="Order not found"
          description="It may have been deleted."
          action={
            <Link to="/admin/orders">
              <Button size="sm">
                <ArrowLeft className="size-4" /> Back to orders
              </Button>
            </Link>
          }
        />
      </AdminPage>
    );
  }

  const canShip = order.status === 'paid';
  const canDeliver = order.status === 'shipped';
  const canCancel = order.status === 'paid';
  const canRefund = ['paid', 'shipped', 'delivered'].includes(order.status);

  return (
    <AdminPage
      title={`Order #${order.id}`}
      description={`Placed ${formatDateTime(order.created_at)} by ${order.customer.email}`}
    >
      <Link
        to="/admin/orders"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All orders
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main column */}
        <div className="flex flex-col gap-6">
          {/* Top — status + customer + actions */}
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  {order.refund_reason && (
                    <span className="text-[11px] text-ink-tertiary">
                      ({order.refund_reason})
                    </span>
                  )}
                </div>
                <p className="mt-2 text-h3 text-ink-primary tabular-nums">
                  {formatPrice(order.total_amount, order.currency)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canDeliver && (
                  <Button
                    size="sm"
                    onClick={() => deliver.mutate(orderId)}
                    loading={deliver.isPending}
                  >
                    <CheckCircle2 className="size-4" /> Mark delivered
                  </Button>
                )}
                {canCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setModal('cancel')}
                  >
                    <XCircle className="size-4" /> Cancel
                  </Button>
                )}
                {canRefund && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setModal('refund')}
                  >
                    <RotateCcw className="size-4" /> Refund
                  </Button>
                )}
              </div>
            </div>

            {/* Inline ship form when status=paid */}
            {canShip && (
              <div className="mt-5">
                <ShipForm order={order} />
              </div>
            )}

            {/* Tracking, if shipped */}
            {(order.tracking_number || order.carrier) && !canShip && (
              <div className="mt-4 rounded-sm border border-line-subtle bg-bg-sunken p-3 text-xs text-ink-secondary">
                <p className="font-medium text-ink-primary">
                  {order.carrier ? order.carrier : 'Shipped'}
                </p>
                {order.tracking_number && (
                  <p className="font-mono">{order.tracking_number}</p>
                )}
              </div>
            )}
          </Card>

          {/* Line items + totals */}
          <Card className="p-5">
            <p className="text-sm font-medium text-ink-primary">Line items</p>
            <table className="mt-3 w-full">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-ink-tertiary">
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Qty</th>
                  <th className="py-2 text-right font-medium">Unit</th>
                  <th className="py-2 text-right font-medium">Line</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id} className="border-t border-line-subtle">
                    <td className="py-3 text-sm text-ink-primary">
                      <Link
                        to={`/admin/products/${it.product_id}/edit`}
                        className="hover:text-accent hover:underline"
                      >
                        Product #{it.product_id}
                      </Link>
                    </td>
                    <td className="py-3 text-sm tabular-nums text-ink-secondary">
                      ×{it.quantity}
                    </td>
                    <td className="py-3 text-right text-sm tabular-nums text-ink-secondary">
                      {formatPrice(it.unit_price, order.currency)}
                    </td>
                    <td className="py-3 text-right text-sm font-semibold tabular-nums text-ink-primary">
                      {formatPrice(
                        Number(it.unit_price) * it.quantity,
                        order.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-4 border-t border-line-subtle pt-3 text-sm">
              <div className="flex justify-between text-ink-secondary">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-ink-primary">
                  {formatPrice(order.subtotal, order.currency)}
                </dd>
              </div>
              {Number(order.tax_amount) > 0 && (
                <div className="mt-1 flex justify-between text-ink-secondary">
                  <dt>Tax</dt>
                  <dd className="tabular-nums text-ink-primary">
                    {formatPrice(order.tax_amount, order.currency)}
                  </dd>
                </div>
              )}
              {Number(order.discount_amount) > 0 && (
                <div className="mt-1 flex justify-between text-success">
                  <dt className="inline-flex items-center gap-1">
                    <TicketPercent className="size-3.5" />
                    Discount
                    {order.coupon_code && (
                      <span className="font-mono text-[10px] text-ink-tertiary">
                        ({order.coupon_code})
                      </span>
                    )}
                  </dt>
                  <dd className="tabular-nums">
                    −{formatPrice(order.discount_amount, order.currency)}
                  </dd>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-line-subtle pt-2 text-ink-primary">
                <dt className="font-medium">Total</dt>
                <dd className="text-h3 tabular-nums">
                  {formatPrice(order.total_amount, order.currency)}
                </dd>
              </div>
            </dl>
          </Card>

          <NotesPanel order={order} />
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-tertiary">
              <Mail className="size-3.5" />
              Customer
            </p>
            <p className="mt-2 text-sm font-medium text-ink-primary">
              {order.customer.email}
            </p>
            {order.customer.full_name && (
              <p className="mt-0.5 text-xs text-ink-secondary">
                {order.customer.full_name}
              </p>
            )}
            <Link
              to={`/admin/users?q=${encodeURIComponent(order.customer.email)}`}
              className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              View customer profile →
            </Link>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-tertiary">
              <Package className="size-3.5" />
              Shipping address
            </p>
            <p className="mt-2 whitespace-pre-line text-sm text-ink-primary">
              {order.shipping_address || '— no address —'}
            </p>
          </Card>

          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-tertiary">
              <CreditCard className="size-3.5" />
              Payment
            </p>
            <p className="mt-2 font-mono text-xs text-ink-secondary">
              {order.payment_intent_id || '—'}
            </p>
          </Card>

          <ShipmentPanel order={order} />

          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-tertiary">
              <ShieldCheck className="size-3.5" />
              Timeline
            </p>
            <div className="mt-3">
              <Timeline order={order} />
            </div>
          </Card>
        </div>
      </div>

      {modal === 'cancel' && (
        <ReasonModal
          title="Cancel order"
          action="Cancel order"
          pending={cancel.isPending}
          onClose={() => setModal(null)}
          onSubmit={(reason) => {
            cancel.mutate(
              { id: orderId, reason },
              { onSuccess: () => setModal(null) },
            );
          }}
        />
      )}
      {modal === 'refund' && (
        <ReasonModal
          title="Refund order"
          action="Issue refund"
          pending={refund.isPending}
          onClose={() => setModal(null)}
          onSubmit={(reason) => {
            refund.mutate(
              { id: orderId, reason },
              { onSuccess: () => setModal(null) },
            );
          }}
        />
      )}
    </AdminPage>
  );
}
