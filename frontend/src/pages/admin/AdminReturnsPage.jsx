import { useState } from 'react';
import {
  Undo2,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  RefreshCcw,
  AlertTriangle,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Textarea } from '@/components/ui/Textarea.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { cn, formatPrice } from '@/lib/utils.js';
import {
  useAdminReturns,
  useApproveReturn,
  useMarkReturnPickedUp,
  useMarkReturnReceived,
  useMarkReturnRefunded,
  useRejectReturn,
} from '@/features/returns/hooks.js';

const STATUS_TONE = {
  requested: 'bg-warning/15 text-warning',
  approved: 'bg-accent/15 text-accent',
  rejected: 'bg-danger/15 text-danger',
  picked_up: 'bg-blue-500/15 text-blue-400',
  received: 'bg-blue-500/15 text-blue-400',
  refunded: 'bg-success/15 text-success',
  cancelled: 'bg-ink-tertiary/15 text-ink-tertiary',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'picked_up', label: 'Picked up' },
  { value: 'received', label: 'Received' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide capitalize',
        STATUS_TONE[status] || 'bg-fill text-ink-secondary',
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function ApprovePanel({ ret, onClose }) {
  // refund_amount left blank => server uses the default (sum of returned-item subtotals)
  const [refund, setRefund] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const approve = useApproveReturn();

  async function submit() {
    setError(null);
    try {
      await approve.mutateAsync({
        id: ret.id,
        admin_notes: notes.trim() || null,
        refund_amount: refund === '' ? null : Number(refund),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not approve.');
    }
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-ink-primary">Approve return</p>
      <p className="text-xs text-ink-tertiary">
        Approving mints a reverse waybill with the carrier. Leave the amount
        blank to refund the returned items&apos; subtotal.
      </p>
      <div className="mt-3">
        <Input
          label="Refund amount"
          type="number"
          step="0.01"
          min="0"
          value={refund}
          onChange={(e) => setRefund(e.target.value)}
          placeholder="auto"
        />
      </div>
      <div className="mt-2">
        <Textarea
          label="Internal notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={approve.isPending}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} loading={approve.isPending}>
          <CheckCircle2 className="size-4" /> Approve
        </Button>
      </div>
    </Card>
  );
}

function RejectPanel({ ret, onClose }) {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const reject = useRejectReturn();

  async function submit() {
    setError(null);
    if (notes.trim().length < 3) {
      setError('Add a short reason — at least 3 characters.');
      return;
    }
    try {
      await reject.mutateAsync({ id: ret.id, admin_notes: notes.trim() });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not reject.');
    }
  }

  return (
    <Card className="p-4">
      <p className="text-sm font-medium text-ink-primary">Reject return</p>
      <p className="text-xs text-ink-tertiary">
        The customer won&apos;t see this note verbatim — it&apos;s recorded
        internally + on the audit log.
      </p>
      <div className="mt-3">
        <Textarea
          label="Reason for rejection"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Past window per phone call; items appear unused; etc."
        />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={reject.isPending}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={submit} loading={reject.isPending}>
          <XCircle className="size-4" /> Reject
        </Button>
      </div>
    </Card>
  );
}

function ReturnRow({ ret, onSelect, selected }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-sm border px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-accent bg-accent/5'
          : 'border-line-subtle bg-bg-sunken hover:border-line-strong',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-primary">Return #{ret.id}</p>
          <p className="mt-0.5 text-[11px] text-ink-tertiary">
            Order #{ret.order_id} · {ret.customer.email}
          </p>
        </div>
        <StatusBadge status={ret.status} />
      </div>
      <p className="mt-1 text-[11px] text-ink-tertiary">
        {ret.reason.replace(/_/g, ' ')} · {formatDateTime(ret.requested_at)}
      </p>
    </button>
  );
}

function ReturnDetailPane({ ret }) {
  const [panel, setPanel] = useState(null); // 'approve' | 'reject' | null
  const pickedUp = useMarkReturnPickedUp();
  const received = useMarkReturnReceived();
  const refunded = useMarkReturnRefunded();
  const [error, setError] = useState(null);

  async function fire(mutation) {
    setError(null);
    try {
      await mutation.mutateAsync(ret.id);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Action failed.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-h3 text-ink-primary">
              <Undo2 className="size-5 text-accent" /> Return #{ret.id}
            </p>
            <p className="mt-1 text-xs text-ink-tertiary">
              Order #{ret.order_id} · {ret.customer.email}
            </p>
          </div>
          <StatusBadge status={ret.status} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Reason</p>
            <p className="text-ink-primary capitalize">{ret.reason.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Refund</p>
            <p className="text-ink-primary tabular-nums">
              {ret.refund_amount != null ? formatPrice(ret.refund_amount) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Requested</p>
            <p className="text-ink-primary">{formatDateTime(ret.requested_at)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Reverse AWB</p>
            <p className="break-all font-mono text-xs text-ink-primary">
              {ret.reverse_awb || '—'}
            </p>
          </div>
        </div>

        {ret.customer_notes && (
          <div className="mt-4 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2 text-xs">
            <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">
              From the customer
            </p>
            <p className="mt-1 whitespace-pre-line text-ink-primary">
              {ret.customer_notes}
            </p>
          </div>
        )}

        {ret.admin_notes && (
          <div className="mt-2 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2 text-xs">
            <p className="text-[10px] uppercase tracking-wide text-ink-tertiary">
              Internal notes
            </p>
            <p className="mt-1 whitespace-pre-line text-ink-primary">{ret.admin_notes}</p>
          </div>
        )}

        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
          Items
        </p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {ret.items.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between rounded-sm border border-line-subtle bg-bg-sunken px-3 py-1.5 text-xs"
            >
              <span className="text-ink-primary">Order item #{i.order_item_id}</span>
              <span className="text-ink-tertiary">× {i.quantity}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap gap-2">
          {ret.status === 'requested' && (
            <>
              <Button size="sm" onClick={() => setPanel('approve')}>
                <CheckCircle2 className="size-4" /> Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPanel('reject')}
              >
                <XCircle className="size-4" /> Reject
              </Button>
            </>
          )}
          {ret.status === 'approved' && (
            <Button size="sm" onClick={() => fire(pickedUp)} loading={pickedUp.isPending}>
              <Truck className="size-4" /> Mark picked up
            </Button>
          )}
          {(ret.status === 'approved' || ret.status === 'picked_up') && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fire(received)}
              loading={received.isPending}
            >
              <PackageCheck className="size-4" /> Mark received
            </Button>
          )}
          {ret.status === 'received' && (
            <Button size="sm" onClick={() => fire(refunded)} loading={refunded.isPending}>
              <RefreshCcw className="size-4" /> Mark refunded
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-danger">
            <AlertTriangle className="size-3.5" /> {error}
          </p>
        )}
      </Card>

      {panel === 'approve' && (
        <ApprovePanel ret={ret} onClose={() => setPanel(null)} />
      )}
      {panel === 'reject' && (
        <RejectPanel ret={ret} onClose={() => setPanel(null)} />
      )}
    </div>
  );
}

export default function AdminReturnsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const { data: returns = [], isLoading } = useAdminReturns(statusFilter || null);

  // Detail pane reflects the freshest copy in the list (so an Approve mutation
  // pushes the new state immediately without another fetch).
  const selected = returns.find((r) => r.id === selectedId) || null;

  return (
    <AdminPage
      title="Returns"
      description="Review customer return requests and walk them through pickup → received → refunded."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setStatusFilter(o.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition-colors',
              statusFilter === o.value
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-line-subtle bg-bg-elevated text-ink-secondary hover:border-line-strong',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          ) : returns.length === 0 ? (
            <Card className="p-5 text-sm text-ink-tertiary">
              No returns in this view.
            </Card>
          ) : (
            returns.map((r) => (
              <ReturnRow
                key={r.id}
                ret={r}
                selected={selectedId === r.id}
                onSelect={() => setSelectedId(r.id)}
              />
            ))
          )}
        </div>

        <div>
          {selected ? (
            <ReturnDetailPane ret={selected} />
          ) : (
            <Card className="p-6 text-sm text-ink-tertiary">
              Select a return on the left to review and act on it.
            </Card>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
