import { useState } from 'react';
import { Undo2, AlertTriangle, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Textarea } from '@/components/ui/Textarea.jsx';
import { useCreateReturn } from '@/features/returns/hooks.js';

// Mirrors backend ReturnReason. Order chosen for likelihood of use.
const REASONS = [
  { value: 'defective', label: 'Item is defective' },
  { value: 'arrived_damaged', label: 'Arrived damaged' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'no_longer_needed', label: 'No longer needed' },
  { value: 'other', label: 'Other' },
];

/**
 * Modal for the customer to request a return on a delivered order.
 *
 * `order` carries items + their per-line quantity. We let the customer
 * pick a return quantity (0..line.quantity) per item; lines with 0 are
 * omitted from the payload.
 */
export default function RequestReturnModal({ order, onClose, onCreated }) {
  // qty-by-order_item_id
  const [qtys, setQtys] = useState({});
  const [reason, setReason] = useState('defective');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const create = useCreateReturn();

  function setQty(itemId, value) {
    setQtys((q) => ({ ...q, [itemId]: Math.max(0, value) }));
  }

  async function submit() {
    setError(null);
    const items = Object.entries(qtys)
      .map(([id, qty]) => ({ order_item_id: Number(id), quantity: Number(qty) }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) {
      setError('Pick at least one unit to return.');
      return;
    }
    try {
      const created = await create.mutateAsync({
        order_id: order.id,
        items,
        reason,
        customer_notes: notes.trim() || null,
      });
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 'Could not submit return.',
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="flex items-center gap-2">
          <Undo2 className="size-5 text-accent" aria-hidden="true" />
          <h2 className="text-h3 text-ink-primary">Request a return</h2>
        </div>
        <p className="mt-1 text-xs text-ink-tertiary">
          Order #{order.id}. We&apos;ll arrange a pickup and refund once items
          arrive back at our warehouse.
        </p>

        <div className="mt-5">
          <p className="text-sm font-medium text-ink-primary">Items</p>
          <ul className="mt-2 flex flex-col gap-2">
            {order.items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-3 rounded-sm border border-line-subtle bg-bg-sunken px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-primary">
                    {it.name || `Product #${it.product_id}`}
                  </p>
                  <p className="text-[11px] text-ink-tertiary">
                    Ordered {it.quantity}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={it.quantity}
                  value={qtys[it.id] ?? 0}
                  onChange={(e) => setQty(it.id, Number(e.target.value))}
                  className="w-20 rounded-sm border border-line-subtle bg-bg-elevated px-2 py-1 text-right text-sm text-ink-primary"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-ink-primary">Why?</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 text-sm text-ink-primary"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={(e) => setReason(e.target.value)}
                  className="text-accent"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Textarea
            label="Anything else? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="A few words help us help you faster."
          />
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-sm border border-danger/30 bg-danger/10 p-2.5 text-sm text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            <Check className="size-4" /> Submit return
          </Button>
        </div>
      </Card>
    </div>
  );
}
