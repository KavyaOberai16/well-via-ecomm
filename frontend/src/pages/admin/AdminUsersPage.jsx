import { useEffect, useMemo, useState } from 'react';
import { Search, Pencil, X, ShieldCheck, Users as UsersIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn } from '@/lib/utils.js';
import { useUsers } from '@/features/users/hooks.js';
import { useRoles, useAssignUserRoles } from '@/features/roles/hooks.js';

const PAGE_SIZE = 25;

function useDebounced(value, ms = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function RoleBadge({ name, isAdmin }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        isAdmin
          ? 'bg-accent/15 text-accent'
          : 'bg-fill text-ink-secondary',
      )}
    >
      {name}
    </span>
  );
}

function RoleAssignForm({ user, roles, onClose }) {
  const [selected, setSelected] = useState(() =>
    new Set((user.roles || []).map((r) => r.id)),
  );
  const [error, setError] = useState(null);
  const assign = useAssignUserRoles();

  function toggle(id) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    try {
      await assign.mutateAsync({ userId: user.id, roleIds: Array.from(selected) });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not update roles.');
    }
  }

  return (
    <tr className="bg-bg-sunken">
      <td colSpan={4} className="px-4 py-4">
        <div className="rounded-sm border border-line-subtle bg-bg-elevated p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink-primary">
              Roles for <span className="font-mono">{user.email}</span>
            </p>
            <button
              type="button"
              aria-label="Cancel"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {roles.length === 0 ? (
              <p className="text-sm text-ink-tertiary">
                No roles defined yet. Create one on the Roles page first.
              </p>
            ) : (
              roles.map((r) => (
                <label
                  key={r.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-sm px-3 py-2 text-sm transition-colors',
                    selected.has(r.id)
                      ? 'bg-accent/10'
                      : 'hover:bg-fill',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="mt-0.5 size-4 rounded-sm border border-line-subtle bg-bg-sunken text-accent focus-visible:focus-ring"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-ink-primary">{r.name}</span>
                    {r.description && (
                      <span className="block text-xs text-ink-tertiary">
                        {r.description}
                      </span>
                    )}
                    <span className="mt-0.5 block text-[10px] text-ink-tertiary">
                      {r.permissions?.length || 0} permission
                      {r.permissions?.length === 1 ? '' : 's'}
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={assign.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={assign.isPending}>
              Save roles
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function UserRow({ user, roles, isEditing, onToggleEdit }) {
  const initial = (user.email || '?').charAt(0).toUpperCase();
  return (
    <>
      <tr className={cn('border-t border-line-subtle', isEditing && 'bg-bg-sunken/40')}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-primary">{user.email}</p>
              {user.full_name && (
                <p className="truncate text-xs text-ink-tertiary">{user.full_name}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {user.is_admin && <RoleBadge name="admin (legacy)" isAdmin />}
            {(user.roles || []).map((r) => (
              <RoleBadge key={r.id} name={r.name} />
            ))}
            {!user.is_admin && (user.roles || []).length === 0 && (
              <span className="text-xs text-ink-tertiary">— shopper —</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
              user.is_active
                ? 'bg-success/15 text-success'
                : 'bg-fill text-ink-tertiary',
            )}
          >
            {user.is_active ? 'Active' : 'Disabled'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            aria-label={`Edit roles for ${user.email}`}
            onClick={onToggleEdit}
            className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
          >
            <Pencil className="size-4" />
          </button>
        </td>
      </tr>
      {isEditing && (
        <RoleAssignForm user={user} roles={roles} onClose={onToggleEdit} />
      )}
    </>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 250);
  const [editingId, setEditingId] = useState(null);

  // Reset to page 1 whenever search changes — otherwise we may sit on an
  // out-of-range page when the result set shrinks.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, refetch } = useUsers({
    q: debouncedSearch,
    page,
    page_size: PAGE_SIZE,
  });
  const { data: roles = [] } = useRoles();

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminPage
      title="Users"
      description={
        isLoading
          ? 'Loading…'
          : `${total} user${total === 1 ? '' : 's'} — assign roles to grant admin access.`
      }
    >
      <div className="mb-4 max-w-md">
        <Input
          icon={Search}
          placeholder="Search by email or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isError ? (
        <EmptyState
          icon={UsersIcon}
          title="Couldn't load users"
          description="Something went wrong. Please try again."
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
          icon={UsersIcon}
          title={debouncedSearch ? 'No users match your search' : 'No users yet'}
          description={
            debouncedSearch
              ? 'Try a different email or name.'
              : 'When customers register they will appear here.'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    roles={roles}
                    isEditing={editingId === u.id}
                    onToggleEdit={() =>
                      setEditingId((cur) => (cur === u.id ? null : u.id))
                    }
                  />
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
