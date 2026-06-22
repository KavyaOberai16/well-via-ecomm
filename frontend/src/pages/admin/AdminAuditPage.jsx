import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TicketPercent,
  Coins,
  ShieldCheck,
  Star,
  Send,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  History,
} from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Select } from '@/components/ui/Select.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn } from '@/lib/utils.js';
import { useAuditEvents } from '@/features/audit/hooks.js';

const PAGE_SIZE = 50;

const ACTION_META = {
  'role.create':         { label: 'Role created',      icon: Plus,         tone: 'success' },
  'role.update':         { label: 'Role updated',      icon: Pencil,       tone: 'neutral' },
  'role.delete':         { label: 'Role deleted',      icon: Trash2,       tone: 'danger' },
  'role.assign':         { label: 'Roles assigned',    icon: ShieldCheck,  tone: 'neutral' },
  'coupon.create':       { label: 'Coupon created',    icon: Plus,         tone: 'success' },
  'coupon.update':       { label: 'Coupon updated',    icon: TicketPercent,tone: 'neutral' },
  'coupon.delete':       { label: 'Coupon deleted',    icon: Trash2,       tone: 'danger' },
  'loyalty.adjust':      { label: 'Points adjusted',   icon: Coins,        tone: 'neutral' },
  'review.admin_create': { label: 'Review added',      icon: Plus,         tone: 'success' },
  'review.admin_update': { label: 'Review moderated',  icon: Star,         tone: 'neutral' },
  'review.admin_delete': { label: 'Review deleted',    icon: Trash2,       tone: 'danger' },
  'session.revoke_all':  { label: 'Sessions revoked',  icon: LogOut,       tone: 'danger' },
};

const TONE_CLASS = {
  success: 'bg-success/15 text-success',
  danger:  'bg-danger/15 text-danger',
  neutral: 'bg-fill text-ink-secondary',
};

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ActionBadge({ action }) {
  const meta = ACTION_META[action] || { label: action, icon: History, tone: 'neutral' };
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
        TONE_CLASS[meta.tone],
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function MetadataPreview({ data }) {
  // The structured detail blob varies per action. Render the most useful
  // shapes specifically and fall back to a JSON pre block for everything else
  // — better an honest dump than an inscrutable "edited".
  if (!data) return null;

  if (data.changes && typeof data.changes === 'object') {
    const entries = Object.entries(data.changes);
    return (
      <dl className="grid gap-1 text-xs">
        {entries.map(([key, change]) => (
          <div key={key} className="flex flex-wrap items-baseline gap-2">
            <dt className="font-medium text-ink-secondary">{key}</dt>
            {Array.isArray(change) ? (
              <dd className="text-ink-primary">{change.join(', ')}</dd>
            ) : change && typeof change === 'object' && 'before' in change ? (
              <dd className="font-mono text-ink-primary">
                <span className="text-ink-tertiary line-through">
                  {JSON.stringify(change.before)}
                </span>
                {' → '}
                <span>{JSON.stringify(change.after)}</span>
              </dd>
            ) : (
              <dd className="font-mono text-ink-primary">{JSON.stringify(change)}</dd>
            )}
          </div>
        ))}
      </dl>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-sm border border-line-subtle bg-bg-sunken p-2 text-[11px] text-ink-secondary">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function AuditRow({ event }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = event.extra && Object.keys(event.extra).length > 0;

  return (
    <>
      <tr className="border-t border-line-subtle">
        <td className="px-4 py-3">
          <ActionBadge action={event.action} />
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-ink-primary">{event.summary}</p>
          {event.target_label && (
            <p className="mt-0.5 text-[11px] text-ink-tertiary">
              target: <span className="font-mono">{event.target_label}</span>
              {event.target_id != null && (
                <span className="ml-1 text-ink-tertiary/70">#{event.target_id}</span>
              )}
            </p>
          )}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-ink-primary">{event.actor_email || '—'}</p>
          {event.actor_ip && (
            <p className="mt-0.5 font-mono text-[11px] text-ink-tertiary">
              {event.actor_ip}
            </p>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-ink-tertiary">
          {formatDateTime(event.created_at)}
        </td>
        <td className="px-4 py-3 text-right">
          {hasDetail ? (
            <button
              type="button"
              aria-label={expanded ? 'Hide detail' : 'Show detail'}
              onClick={() => setExpanded((v) => !v)}
              className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
            >
              {expanded ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
          ) : (
            <span className="text-[10px] text-ink-tertiary">—</span>
          )}
        </td>
      </tr>
      {expanded && hasDetail && (
        <tr className="bg-bg-sunken/40">
          <td colSpan={5} className="px-4 py-3">
            <MetadataPreview data={event.extra} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminAuditPage() {
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [action, targetType]);

  const opts = useMemo(
    () => ({
      action: action || undefined,
      target_type: targetType || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    [action, targetType, page],
  );

  const { data, isLoading, isError, refetch } = useAuditEvents(opts);
  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const actions = data?.available_actions || [];

  const TARGET_TYPES = ['role', 'coupon', 'user', 'review'];

  return (
    <AdminPage
      title="Audit log"
      description="Immutable record of admin actions. Useful for incident response, dispute resolution, and compliance."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Select value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {ACTION_META[a]?.label || a}
            </option>
          ))}
        </Select>
        <Select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
          <option value="">All target types</option>
          {TARGET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Button variant="ghost" onClick={() => refetch()} disabled={isLoading}>
          <Search className="size-4" /> Refresh
        </Button>
      </div>

      {isError ? (
        <EmptyState
          icon={Shield}
          title="Couldn't load audit events"
          description="Please try again."
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={History}
          title={action || targetType ? 'No events match your filters' : 'No audit events yet'}
          description={
            action || targetType
              ? 'Try clearing a filter.'
              : 'Sensitive admin actions will appear here as they happen.'
          }
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-ink-tertiary">
            {total.toLocaleString()} event{total === 1 ? '' : 's'}
          </p>
          <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                  <th className="px-4 py-3 font-medium">Actor</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 text-right font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <AuditRow key={e.id} event={e} />
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
