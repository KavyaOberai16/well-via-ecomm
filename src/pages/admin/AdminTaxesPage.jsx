import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, X, Percent } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn } from '@/lib/utils.js';
import {
  useTaxes,
  useCreateTax,
  useUpdateTax,
  useDeleteTax,
} from '@/features/taxes/hooks.js';

const EMPTY = { name: '', rate: '', is_active: true };

function TaxForm({ initial, mode, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [error, setError] = useState(null);
  const create = useCreateTax();
  const update = useUpdateTax();

  useEffect(() => {
    setForm(initial || EMPTY);
    setError(null);
  }, [initial]);

  const pending = create.isPending || update.isPending;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Tax name is required.');
      return;
    }
    const rate = Number(form.rate);
    if (form.rate === '' || Number.isNaN(rate) || rate < 0 || rate > 100) {
      setError('Rate must be between 0 and 100.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      rate,
      is_active: !!form.is_active,
    };
    try {
      if (mode === 'edit' && initial?.id) {
        await update.mutateAsync({ id: initial.id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save the tax.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-line-subtle bg-bg-elevated p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-h3 text-ink-primary">
          {mode === 'edit' ? 'Edit tax' : 'New tax'}
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
        <Input
          label="Name"
          placeholder="GST 18%"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          helper="Shown on receipts and the cart breakdown."
        />
        <Input
          label="Rate (%)"
          type="number"
          step="0.001"
          min="0"
          max="100"
          placeholder="18"
          value={form.rate}
          onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))}
          helper="Up to 3 decimal places (e.g. 18.000)."
        />
      </div>

      <label className="mt-2 flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          className="size-4 rounded-sm border border-line-subtle bg-bg-sunken text-accent focus-visible:focus-ring"
        />
        Active — inactive taxes are skipped at checkout even if still attached to products.
      </label>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {mode === 'edit' ? 'Save changes' : 'Create tax'}
        </Button>
      </div>
    </form>
  );
}

function TaxRow({ tax, onEdit }) {
  const update = useUpdateTax();
  const del = useDeleteTax();
  const [confirming, setConfirming] = useState(false);

  const pending = update.isPending || del.isPending;

  function toggleActive() {
    update.mutate({ id: tax.id, data: { is_active: !tax.is_active } });
  }

  return (
    <tr className="border-t border-line-subtle">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-ink-primary">{tax.name}</p>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
        {Number(tax.rate).toFixed(3)}%
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={tax.is_active}
          aria-label={tax.is_active ? 'Deactivate' : 'Activate'}
          disabled={pending}
          onClick={toggleActive}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            'focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none',
            tax.is_active ? 'bg-accent' : 'bg-fill-strong',
          )}
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              tax.is_active ? 'translate-x-4' : 'translate-x-0',
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
                  del.mutate(tax.id, { onSuccess: () => setConfirming(false) })
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
                aria-label={`Edit ${tax.name}`}
                disabled={pending}
                onClick={() => onEdit(tax)}
                className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring disabled:opacity-30 disabled:pointer-events-none"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${tax.name}`}
                disabled={pending}
                onClick={() => setConfirming(true)}
                className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-danger/10 hover:text-danger focus-visible:focus-ring disabled:opacity-30 disabled:pointer-events-none"
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

export default function AdminTaxesPage() {
  const { data: taxes = [], isLoading, isError, refetch } = useTaxes();
  const [editing, setEditing] = useState(null);

  const isFormOpen = editing !== null;
  const formInitial =
    editing && editing !== 'new'
      ? { id: editing.id, name: editing.name, rate: editing.rate, is_active: editing.is_active }
      : null;

  return (
    <AdminPage
      title="Taxes"
      description={
        isLoading
          ? 'Loading…'
          : `${taxes.length} tax rate${taxes.length === 1 ? '' : 's'} — attach to products from the product form.`
      }
      action={
        !isFormOpen && (
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden="true" />
            New tax
          </Button>
        )
      }
    >
      {isFormOpen && (
        <TaxForm
          mode={editing === 'new' ? 'create' : 'edit'}
          initial={formInitial}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {isError ? (
        <EmptyState
          icon={Percent}
          title="Couldn't load taxes"
          description="Something went wrong. Please try again."
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : taxes.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="No taxes yet"
          description="Create your first tax rate to start collecting it at checkout."
          action={
            !isFormOpen && (
              <Button onClick={() => setEditing('new')}>
                <Plus className="size-4" aria-hidden="true" />
                New tax
              </Button>
            )
          }
          className="py-12"
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {taxes.map((t) => (
                <TaxRow key={t.id} tax={t} onEdit={setEditing} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
