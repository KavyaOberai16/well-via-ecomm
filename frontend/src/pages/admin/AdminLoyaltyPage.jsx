import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Coins,
  Gift,
  Users as UsersIcon,
  Sparkles,
  ShoppingBag,
  Star,
  TicketPercent,
  RefreshCw,
  Minus,
  Send,
  Timer,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn, formatPrice } from '@/lib/utils.js';
import { useUsers } from '@/features/users/hooks.js';
import {
  useAdminUserLoyalty,
  useAdminAdjust,
  useAdminTiers,
  useAdminCreateTier,
  useAdminUpdateTier,
  useAdminDeleteTier,
  useAdminReferrals,
  useAdminExpirePoints,
  useAdminEarnRules,
  useAdminUpdateEarnRule,
  useAdminVipTiers,
  useAdminCreateVipTier,
  useAdminUpdateVipTier,
  useAdminDeleteVipTier,
} from '@/features/loyalty/hooks.js';

const REASON_LABELS = {
  signup_bonus: { label: 'Welcome bonus', icon: Sparkles },
  place_order: { label: 'Order', icon: ShoppingBag },
  write_review: { label: 'Review', icon: Star },
  redeem: { label: 'Redeemed', icon: TicketPercent },
  refund_reversal: { label: 'Refund reversal', icon: RefreshCw },
  expiry: { label: 'Expired', icon: RefreshCw },
  admin_adjust: { label: 'Admin adjustment', icon: Pencil },
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

// ---- Users tab ----

function UserPicker({ onPick, picked }) {
  const [q, setQ] = useState('');
  const dq = useDebounced(q, 250);
  const { data, isLoading } = useUsers({ q: dq, page: 1, page_size: 8 });
  const users = data?.items || [];

  return (
    <div className="rounded-lg border border-line-subtle bg-bg-elevated p-4">
      <p className="text-sm font-medium text-ink-primary">Find a customer</p>
      <div className="mt-3">
        <Input
          icon={Search}
          placeholder="Search by email or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {q.trim() && (
        <ul className="mt-1 divide-y divide-line-subtle">
          {isLoading ? (
            <li className="px-2 py-3 text-xs text-ink-tertiary">Searching…</li>
          ) : users.length === 0 ? (
            <li className="px-2 py-3 text-xs text-ink-tertiary">No matches.</li>
          ) : (
            users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onPick(u)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left transition-colors',
                    picked?.id === u.id ? 'bg-accent/10' : 'hover:bg-fill',
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                    {(u.email || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-primary">{u.email}</span>
                    {u.full_name && (
                      <span className="block truncate text-xs text-ink-tertiary">
                        {u.full_name}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-ink-tertiary">
                    #{u.id}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function AdjustForm({ userId, onDone }) {
  const [delta, setDelta] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const adjust = useAdminAdjust();

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const n = Number(delta);
    if (!Number.isFinite(n) || n === 0 || !Number.isInteger(n)) {
      setError('Enter a non-zero whole number.');
      return;
    }
    if (description.trim().length < 3) {
      setError('Provide a reason — adjustments require a paper trail.');
      return;
    }
    try {
      await adjust.mutateAsync({ userId, delta: n, description: description.trim() });
      setDelta('');
      setDescription('');
      onDone?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not adjust.');
    }
  }

  return (
    <form onSubmit={submit} className="rounded-sm border border-line-subtle bg-bg-sunken p-4">
      <p className="text-sm font-medium text-ink-primary">Adjust points</p>
      <p className="mt-0.5 text-xs text-ink-tertiary">
        Positive = credit, negative = debit. Lifetime points won&apos;t change.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[140px_1fr_auto]">
        <Input
          type="number"
          step="1"
          placeholder="±points"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
        />
        <Input
          placeholder="Reason (required)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button type="submit" loading={adjust.isPending}>
          Apply
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </form>
  );
}

function LedgerRow({ tx }) {
  const meta = REASON_LABELS[tx.reason] || { label: tx.reason, icon: RefreshCw };
  const Icon = meta.icon;
  const isCredit = tx.delta > 0;
  return (
    <tr className="border-t border-line-subtle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'grid size-7 place-items-center rounded-full',
              isCredit ? 'bg-success/15 text-success' : 'bg-fill text-ink-secondary',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
          </span>
          <span className="text-sm text-ink-primary">{meta.label}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-ink-tertiary">{tx.description || '—'}</td>
      <td className="px-4 py-3 text-xs text-ink-tertiary">
        {tx.ref_type ? `${tx.ref_type} #${tx.ref_id}` : '—'}
      </td>
      <td className="px-4 py-3 text-xs text-ink-tertiary">{formatDate(tx.created_at)}</td>
      <td
        className={cn(
          'px-4 py-3 text-right text-sm font-semibold tabular-nums',
          isCredit ? 'text-success' : 'text-ink-secondary',
        )}
      >
        {isCredit ? '+' : ''}
        {tx.delta.toLocaleString()}
      </td>
    </tr>
  );
}

function UserLoyaltyPanel({ user, onChange }) {
  const { data, isLoading, refetch } = useAdminUserLoyalty(user.id);

  return (
    <div className="rounded-lg border border-line-subtle bg-bg-elevated">
      <div className="flex flex-wrap items-center gap-3 border-b border-line-subtle px-5 py-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
          {(user.email || '?').charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-primary">{user.email}</p>
          {user.full_name && (
            <p className="truncate text-xs text-ink-tertiary">{user.full_name}</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
        <button
          type="button"
          aria-label="Clear"
          onClick={() => onChange(null)}
          className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-4 border-b border-line-subtle p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-tertiary">Balance</p>
          <p className="mt-1 text-[1.75rem] font-semibold text-ink-primary tabular-nums">
            {isLoading
              ? <Skeleton className="h-7 w-24" />
              : (data?.balance ?? 0).toLocaleString()}{' '}
            <span className="text-sm font-normal text-ink-tertiary">pts</span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-tertiary">Lifetime</p>
          <p className="mt-1 text-[1.25rem] font-semibold text-ink-secondary tabular-nums">
            {isLoading
              ? <Skeleton className="h-6 w-20" />
              : (data?.lifetime ?? 0).toLocaleString()}{' '}
            <span className="text-sm font-normal text-ink-tertiary">pts</span>
          </p>
        </div>
      </div>

      <div className="p-5">
        <AdjustForm userId={user.id} />
      </div>

      <div className="border-t border-line-subtle px-5 py-4">
        <p className="text-sm font-medium text-ink-primary">Ledger</p>
        <p className="mt-0.5 text-xs text-ink-tertiary">
          Most recent first. Append-only — every row is preserved.
        </p>
        <div className="mt-3 overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (data?.transactions || []).length === 0 ? (
            <p className="text-sm text-ink-tertiary">No activity yet.</p>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-2 font-medium">Reason</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium">Ref</th>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 text-right font-medium">Delta</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((t) => (
                  <LedgerRow key={t.id} tx={t} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [picked, setPicked] = useState(null);
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <UserPicker onPick={setPicked} picked={picked} />
      {picked ? (
        <UserLoyaltyPanel user={picked} onChange={setPicked} />
      ) : (
        <EmptyState
          icon={UsersIcon}
          title="Pick a customer to view their loyalty"
          description="Search above to load their balance, ledger, and adjustment controls."
        />
      )}
    </div>
  );
}

// ---- Tiers tab ----

const EMPTY_TIER = {
  name: '',
  cost_points: '',
  discount_type: 'percent',
  discount_value: '',
  max_discount: '',
  expires_after_days: 30,
  is_active: true,
};

function TierForm({ initial, mode, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY_TIER);
  const [error, setError] = useState(null);
  const create = useAdminCreateTier();
  const update = useAdminUpdateTier();

  useEffect(() => {
    setForm(initial || EMPTY_TIER);
    setError(null);
  }, [initial]);

  const pending = create.isPending || update.isPending;

  function set(k) {
    return (e) => {
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [k]: v }));
    };
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('Name is required.');
    const cost = Number(form.cost_points);
    if (!cost || cost < 1) return setError('Cost must be a positive number.');
    const value = Number(form.discount_value);
    if (!value || value <= 0) return setError('Discount value must be > 0.');
    if (form.discount_type === 'percent' && value > 100) {
      return setError('Percent value cannot exceed 100.');
    }
    const payload = {
      name: form.name.trim(),
      cost_points: cost,
      discount_type: form.discount_type,
      discount_value: value,
      max_discount: form.max_discount === '' ? null : Number(form.max_discount),
      expires_after_days: Number(form.expires_after_days) || 30,
      is_active: !!form.is_active,
    };
    try {
      if (mode === 'edit' && initial?.id) {
        await update.mutateAsync({ tierId: initial.id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save the tier.');
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 rounded-lg border border-line-subtle bg-bg-elevated p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-h3 text-ink-primary">
          {mode === 'edit' ? 'Edit tier' : 'New tier'}
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
          placeholder="10% off"
          value={form.name}
          onChange={set('name')}
          helper="What customers see on the rewards page."
        />
        <Input
          label="Cost in points"
          type="number"
          min="1"
          step="1"
          value={form.cost_points}
          onChange={set('cost_points')}
        />
        <Select label="Discount type" value={form.discount_type} onChange={set('discount_type')}>
          <option value="percent">Percent (%)</option>
          <option value="fixed">Fixed amount</option>
        </Select>
        <Input
          label={form.discount_type === 'percent' ? 'Percent off' : 'Amount off'}
          type="number"
          step="0.01"
          min="0"
          value={form.discount_value}
          onChange={set('discount_value')}
        />
        <Input
          label="Max discount (optional)"
          type="number"
          step="0.01"
          min="0"
          value={form.max_discount}
          onChange={set('max_discount')}
          helper={
            form.discount_type === 'percent'
              ? 'Caps a percent discount.'
              : 'Usually unused for fixed amounts.'
          }
        />
        <Input
          label="Coupon validity (days)"
          type="number"
          min="1"
          max="365"
          step="1"
          value={form.expires_after_days}
          onChange={set('expires_after_days')}
        />
      </div>

      <label className="mt-2 flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={set('is_active')}
          className="size-4 rounded-sm border border-line-subtle bg-bg-sunken text-accent focus-visible:focus-ring"
        />
        Active — customers can redeem this tier
      </label>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {mode === 'edit' ? 'Save changes' : 'Create tier'}
        </Button>
      </div>
    </form>
  );
}

function describeTierReward(tier) {
  if (tier.discount_type === 'percent') {
    const cap = tier.max_discount ? ` (up to ${formatPrice(tier.max_discount)})` : '';
    return `${Number(tier.discount_value)}% off${cap}`;
  }
  return `${formatPrice(tier.discount_value)} off`;
}

function TierRow({ tier, onEdit }) {
  const del = useAdminDeleteTier();
  const update = useAdminUpdateTier();
  const [confirming, setConfirming] = useState(false);
  const pending = del.isPending || update.isPending;

  function toggleActive() {
    update.mutate({ tierId: tier.id, data: { is_active: !tier.is_active } });
  }

  return (
    <tr className="border-t border-line-subtle">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-ink-primary">{tier.name}</p>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
        {tier.cost_points.toLocaleString()} pts
      </td>
      <td className="px-4 py-3 text-sm text-ink-secondary">{describeTierReward(tier)}</td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
        {tier.expires_after_days}d
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          role="switch"
          aria-checked={tier.is_active}
          aria-label={tier.is_active ? 'Deactivate' : 'Activate'}
          disabled={pending}
          onClick={toggleActive}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            'focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none',
            tier.is_active ? 'bg-accent' : 'bg-fill-strong',
          )}
        >
          <span
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
              tier.is_active ? 'translate-x-4' : 'translate-x-0',
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
                  del.mutate(tier.id, { onSuccess: () => setConfirming(false) })
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
                aria-label="Edit"
                disabled={pending}
                onClick={() => onEdit(tier)}
                className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Delete"
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

function TiersTab() {
  const { data: tiers = [], isLoading, isError, refetch } = useAdminTiers();
  const [editing, setEditing] = useState(null);

  const isFormOpen = editing !== null;
  const initial =
    editing && editing !== 'new'
      ? {
          id: editing.id,
          name: editing.name,
          cost_points: editing.cost_points,
          discount_type: editing.discount_type,
          discount_value: editing.discount_value,
          max_discount: editing.max_discount ?? '',
          expires_after_days: editing.expires_after_days,
          is_active: editing.is_active,
        }
      : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-secondary">
            Customers see active tiers on the /rewards page and redeem them for one-time
            coupons.
          </p>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" /> New tier
          </Button>
        )}
      </div>

      {isFormOpen && (
        <TierForm
          mode={editing === 'new' ? 'create' : 'edit'}
          initial={initial}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {isError ? (
        <EmptyState
          icon={Gift}
          title="Couldn't load tiers"
          description="Please try again."
          action={<Button size="sm" onClick={() => refetch()}>Retry</Button>}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
        </div>
      ) : tiers.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No redemption tiers yet"
          description="Create one so customers can spend their points."
          action={!isFormOpen && (
            <Button onClick={() => setEditing('new')}>
              <Plus className="size-4" /> New tier
            </Button>
          )}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3 font-medium">Reward</th>
                <th className="px-4 py-3 font-medium">Valid</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <TierRow key={t.id} tier={t} onEdit={setEditing} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Referrals tab ----

function ReferralsTab() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const opts = useMemo(
    () => ({ status: statusFilter || undefined, page, page_size: 50 }),
    [statusFilter, page],
  );
  useEffect(() => setPage(1), [statusFilter]);

  const { data, isLoading } = useAdminReferrals(opts);
  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <div>
      <div className="mb-4 max-w-xs">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All referrals</option>
          <option value="pending">Pending only</option>
          <option value="completed">Completed only</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No referrals yet"
          description="Customers can share their referral code from /rewards to start inviting friends."
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-ink-tertiary">
            {total.toLocaleString()} total
          </p>
          <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-3 font-medium">Referrer</th>
                  <th className="px-4 py-3 font-medium">Friend</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Signed up</th>
                  <th className="px-4 py-3 font-medium">Completed</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t border-line-subtle">
                    <td className="px-4 py-3 text-sm text-ink-primary">
                      {r.referrer_email}
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-primary">
                      {r.referred_email}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-tertiary">
                      {r.code}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-tertiary">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-tertiary">
                      {formatDate(r.completed_at) || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                          r.status === 'completed'
                            ? 'bg-success/15 text-success'
                            : 'bg-fill text-ink-secondary',
                        )}
                      >
                        {r.status === 'completed' ? (
                          <CheckCircle2 className="size-3" />
                        ) : (
                          <Clock className="size-3" />
                        )}
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ---- Maintenance tab (expiry) ----

function MaintenanceTab() {
  const expire = useAdminExpirePoints();
  const [lastResult, setLastResult] = useState(null);

  function run() {
    expire.mutate(undefined, {
      onSuccess: (data) => setLastResult({ ok: true, ...data, ranAt: new Date() }),
      onError: (err) =>
        setLastResult({
          ok: false,
          message:
            err?.response?.data?.error?.message ||
            'Could not run expiry. Check logs.',
        }),
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="rounded-lg border border-line-subtle bg-bg-elevated p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-warning/15 text-warning">
            <Timer className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-h3 text-ink-primary">Run points expiry</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Walks every customer&apos;s ledger oldest-first. Earn rows past
              their <code className="font-mono text-xs">expires_at</code> that
              haven&apos;t been fully consumed produce an <code className="font-mono text-xs">EXPIRY</code> debit.
              Idempotent — safe to run any time. Schedule this nightly in production.
            </p>
            <div className="mt-4">
              <Button onClick={run} loading={expire.isPending}>
                <Timer className="size-4" /> Run expiry sweep now
              </Button>
            </div>
          </div>
        </div>

        {lastResult && (
          <div
            className={cn(
              'mt-5 rounded-sm border p-3 text-sm',
              lastResult.ok
                ? 'border-success/30 bg-success/10 text-ink-primary'
                : 'border-danger/30 bg-danger/10 text-danger',
            )}
          >
            {lastResult.ok ? (
              <>
                <p className="font-medium">Expiry complete</p>
                <p className="mt-1 text-xs text-ink-secondary">
                  Users processed:{' '}
                  <strong className="text-ink-primary">
                    {lastResult.users_processed}
                  </strong>{' '}
                  · Rows expired:{' '}
                  <strong className="text-ink-primary">
                    {lastResult.rows_expired}
                  </strong>{' '}
                  · Points expired:{' '}
                  <strong className="text-ink-primary">
                    {lastResult.points_expired.toLocaleString()}
                  </strong>
                </p>
              </>
            ) : (
              <p>{lastResult.message}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Earn rules tab ----

const RULE_ICONS = {
  signup_bonus: Sparkles,
  place_order: ShoppingBag,
  write_review: Star,
};

function EarnRulesTab() {
  const { data: rules = [], isLoading } = useAdminEarnRules();
  const update = useAdminUpdateEarnRule();
  const [edits, setEdits] = useState({}); // ruleId -> partial form
  const [savedRule, setSavedRule] = useState(null);

  function localEdit(rule, patch) {
    setEdits((cur) => ({
      ...cur,
      [rule.id]: { ...rule, ...(cur[rule.id] || {}), ...patch },
    }));
  }

  async function save(rule) {
    const draft = edits[rule.id];
    if (!draft) return;
    const payload = {};
    if (Number(draft.points_value) !== rule.points_value) {
      payload.points_value = Number(draft.points_value);
    }
    if (draft.is_active !== rule.is_active) {
      payload.is_active = !!draft.is_active;
    }
    if (Object.keys(payload).length === 0) return;
    try {
      await update.mutateAsync({ ruleId: rule.id, data: payload });
      setEdits((cur) => {
        const next = { ...cur };
        delete next[rule.id];
        return next;
      });
      setSavedRule(rule.id);
      setTimeout(() => setSavedRule((cur) => (cur === rule.id ? null : cur)), 1500);
    } catch (_err) {
      /* swallow — Button shows pending state, errors surface in dev tools */
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <p className="mb-4 text-sm text-ink-secondary">
        Each rule is triggered by a domain event (signup, paid order, review).
        Adjust the points value or toggle a rule off to disable it without a
        code change. Customers see updated values on their next earn.
      </p>

      <div className="flex flex-col gap-3">
        {rules.map((rule) => {
          const draft = edits[rule.id] || rule;
          const dirty =
            Number(draft.points_value) !== rule.points_value ||
            draft.is_active !== rule.is_active;
          const Icon = RULE_ICONS[rule.key] || Award;
          const hint =
            rule.key === 'place_order'
              ? 'Points per ₹1 of order subtotal (after discount).'
              : rule.key === 'signup_bonus'
                ? 'One-time bonus on account registration.'
                : 'Points per submitted review.';
          return (
            <div
              key={rule.id}
              className="rounded-lg border border-line-subtle bg-bg-elevated p-5"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-primary">
                      {rule.display_name}
                    </h3>
                    <code className="font-mono text-[10px] text-ink-tertiary">
                      {rule.key}
                    </code>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-tertiary">{hint}</p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end">
                    <Input
                      label="Points"
                      type="number"
                      min="0"
                      step="1"
                      value={draft.points_value}
                      onChange={(e) =>
                        localEdit(rule, { points_value: e.target.value })
                      }
                    />
                    <label className="inline-flex items-center gap-2 self-center text-sm text-ink-secondary">
                      <input
                        type="checkbox"
                        checked={!!draft.is_active}
                        onChange={(e) =>
                          localEdit(rule, { is_active: e.target.checked })
                        }
                        className="size-4 rounded-sm border border-line-subtle bg-bg-sunken text-accent focus-visible:focus-ring"
                      />
                      Active
                    </label>
                    <Button
                      size="sm"
                      disabled={!dirty}
                      loading={update.isPending && update.variables?.ruleId === rule.id}
                      onClick={() => save(rule)}
                    >
                      {savedRule === rule.id ? (
                        <>
                          <CheckCircle2 className="size-4" /> Saved
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- VIP tiers tab ----

const EMPTY_VIP_FORM = {
  name: '',
  threshold_lifetime_points: '',
  earn_multiplier: '1.00',
  benefits: '',
  color: '#CD7F32',
  sort_order: 0,
};

function VipTierForm({ initial, mode, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY_VIP_FORM);
  const [error, setError] = useState(null);
  const create = useAdminCreateVipTier();
  const update = useAdminUpdateVipTier();

  useEffect(() => {
    setForm(initial || EMPTY_VIP_FORM);
    setError(null);
  }, [initial]);

  const pending = create.isPending || update.isPending;

  function set(k) {
    return (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError('Name is required.');
    const thr = Number(form.threshold_lifetime_points);
    if (Number.isNaN(thr) || thr < 0) return setError('Threshold must be ≥ 0.');
    const mult = Number(form.earn_multiplier);
    if (Number.isNaN(mult) || mult < 1 || mult > 10) {
      return setError('Multiplier must be between 1.00 and 10.00.');
    }
    const payload = {
      name: form.name.trim(),
      threshold_lifetime_points: thr,
      earn_multiplier: mult,
      benefits: form.benefits?.trim() || null,
      color: form.color?.trim() || null,
      sort_order: Number(form.sort_order) || 0,
    };
    try {
      if (mode === 'edit' && initial?.id) {
        await update.mutateAsync({ tierId: initial.id, data: payload });
      } else {
        await create.mutateAsync(payload);
      }
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save the tier.');
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 rounded-lg border border-line-subtle bg-bg-elevated p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-h3 text-ink-primary">
          {mode === 'edit' ? 'Edit VIP tier' : 'New VIP tier'}
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
          placeholder="Silver"
          value={form.name}
          onChange={set('name')}
        />
        <Input
          label="Threshold (lifetime pts)"
          type="number"
          min="0"
          step="1"
          value={form.threshold_lifetime_points}
          onChange={set('threshold_lifetime_points')}
          helper="Lowest tier should be 0."
        />
        <Input
          label="Earn multiplier"
          type="number"
          min="1"
          max="10"
          step="0.01"
          value={form.earn_multiplier}
          onChange={set('earn_multiplier')}
          helper="1.00 = no boost, 1.25 = 25% extra on every earn."
        />
        <Input
          label="Badge color"
          type="text"
          placeholder="#C0C0C0"
          value={form.color}
          onChange={set('color')}
          helper="Hex code for the storefront badge."
        />
      </div>

      <div className="mt-1">
        <Input
          label="Benefits (optional)"
          placeholder="25% bonus on every points earn."
          value={form.benefits}
          onChange={set('benefits')}
          maxLength={500}
        />
      </div>

      <Input
        label="Sort order"
        type="number"
        min="0"
        step="1"
        value={form.sort_order}
        onChange={set('sort_order')}
        helper="Lower numbers appear first in the storefront ladder."
      />

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {mode === 'edit' ? 'Save changes' : 'Create tier'}
        </Button>
      </div>
    </form>
  );
}

function VipTierRow({ tier, onEdit }) {
  const del = useAdminDeleteVipTier();
  const [confirming, setConfirming] = useState(false);
  return (
    <tr className="border-t border-line-subtle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-3 rounded-full border border-line-subtle"
            style={{ backgroundColor: tier.color || 'transparent' }}
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-ink-primary">{tier.name}</p>
        </div>
        {tier.benefits && (
          <p className="mt-0.5 text-xs text-ink-tertiary">{tier.benefits}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
        {tier.threshold_lifetime_points.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
        {Number(tier.earn_multiplier).toFixed(2)}×
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-tertiary">
        {tier.sort_order}
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
                  del.mutate(tier.id, { onSuccess: () => setConfirming(false) })
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
                aria-label="Edit"
                onClick={() => onEdit(tier)}
                className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Delete"
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

function VipTiersTab() {
  const { data: tiers = [], isLoading } = useAdminVipTiers();
  const [editing, setEditing] = useState(null);
  const isFormOpen = editing !== null;
  const initial =
    editing && editing !== 'new'
      ? {
          id: editing.id,
          name: editing.name,
          threshold_lifetime_points: editing.threshold_lifetime_points,
          earn_multiplier: String(editing.earn_multiplier),
          benefits: editing.benefits || '',
          color: editing.color || '',
          sort_order: editing.sort_order,
        }
      : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-secondary">
          Customers move up automatically when their lifetime points cross a
          threshold. The multiplier applies to every positive earn at or above
          that tier.
        </p>
        {!isFormOpen && (
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" /> New tier
          </Button>
        )}
      </div>

      {isFormOpen && (
        <VipTierForm
          mode={editing === 'new' ? 'create' : 'edit'}
          initial={initial}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : tiers.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No VIP tiers configured"
          description="Add at least one tier with threshold 0 so every customer has a starting tier."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Threshold</th>
                <th className="px-4 py-3 font-medium">Multiplier</th>
                <th className="px-4 py-3 font-medium">Sort</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <VipTierRow key={t.id} tier={t} onEdit={setEditing} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---- Page shell ----

export default function AdminLoyaltyPage() {
  const [tab, setTab] = useState('users');

  const tabs = [
    { id: 'users', label: 'Customers', icon: UsersIcon },
    { id: 'tiers', label: 'Redemption tiers', icon: Coins },
    { id: 'earn-rules', label: 'Earn rules', icon: TrendingUp },
    { id: 'vip-tiers', label: 'VIP tiers', icon: Award },
    { id: 'referrals', label: 'Referrals', icon: Send },
    { id: 'maintenance', label: 'Maintenance', icon: Timer },
  ];

  return (
    <AdminPage
      title="Loyalty"
      description="Track customer points balances, configure redemption tiers, and manage the referral program."
    >
      <div
        role="tablist"
        className="mb-6 inline-flex flex-wrap rounded-sm border border-line-subtle bg-bg-elevated p-1"
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors focus-visible:focus-ring',
                tab === t.id
                  ? 'bg-accent/15 text-accent'
                  : 'text-ink-secondary hover:text-ink-primary',
              )}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'tiers' && <TiersTab />}
      {tab === 'earn-rules' && <EarnRulesTab />}
      {tab === 'vip-tiers' && <VipTiersTab />}
      {tab === 'referrals' && <ReferralsTab />}
      {tab === 'maintenance' && <MaintenanceTab />}
    </AdminPage>
  );
}
