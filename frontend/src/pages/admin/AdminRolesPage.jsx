import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, X, ShieldCheck, Lock, Users as UsersIcon } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { cn } from '@/lib/utils.js';
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
} from '@/features/roles/hooks.js';

const EMPTY_FORM = { name: '', description: '', permission_ids: [] };

// Group permissions by their `group_name` for the checklist UI.
function groupPermissions(permissions) {
  const groups = {};
  for (const p of permissions) {
    const key = p.group_name || 'Other';
    (groups[key] ||= []).push(p);
  }
  // Sort group names alphabetically; within each group, sort by name.
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, perms]) => [name, perms.sort((a, b) => a.name.localeCompare(b.name))]);
}

function PermissionPicker({ permissions, selected, onChange, disabled }) {
  const grouped = useMemo(() => groupPermissions(permissions), [permissions]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggle(id) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  }

  function toggleGroup(perms) {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedSet.has(id));
    const next = new Set(selectedSet);
    if (allSelected) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    onChange(Array.from(next));
  }

  if (!permissions?.length) {
    return (
      <p className="text-sm text-ink-tertiary">
        Permissions list isn't loaded yet.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {grouped.map(([groupName, perms]) => {
        const allSelected = perms.every((p) => selectedSet.has(p.id));
        const someSelected = !allSelected && perms.some((p) => selectedSet.has(p.id));
        return (
          <fieldset
            key={groupName}
            className="rounded-sm border border-line-subtle bg-bg-sunken p-4"
          >
            <legend className="-mt-2 mb-2 flex items-center gap-2 bg-bg-elevated px-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              {groupName}
              <button
                type="button"
                onClick={() => toggleGroup(perms)}
                disabled={disabled}
                className="rounded-sm px-1 py-0.5 text-[10px] font-medium text-accent normal-case tracking-normal hover:bg-fill focus-visible:focus-ring disabled:opacity-40 disabled:pointer-events-none"
              >
                {allSelected ? 'Clear all' : 'Select all'}
              </button>
            </legend>
            <div className="flex flex-col gap-2">
              {perms.map((p) => {
                const checked = selectedSet.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors',
                      checked
                        ? 'bg-accent/10 text-ink-primary'
                        : 'text-ink-secondary hover:bg-fill',
                      disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(p.id)}
                      className="mt-0.5 size-4 rounded-sm border border-line-subtle bg-bg-elevated text-accent focus-visible:focus-ring"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs text-ink-primary">
                        {p.name}
                      </span>
                      {p.description && (
                        <span className="block text-xs text-ink-tertiary">
                          {p.description}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            {someSelected && (
              <p className="mt-2 text-[10px] text-ink-tertiary">
                {perms.filter((p) => selectedSet.has(p.id)).length}/{perms.length} selected
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

function RoleForm({ initial, mode, permissions, onCancel, onSaved }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [error, setError] = useState(null);
  const create = useCreateRole();
  const update = useUpdateRole();

  useEffect(() => {
    setForm(initial || EMPTY_FORM);
    setError(null);
  }, [initial]);

  const pending = create.isPending || update.isPending;
  const isSystem = !!initial?.is_system;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Role name is required.');
      return;
    }
    try {
      if (mode === 'edit' && initial?.id) {
        await update.mutateAsync({
          id: initial.id,
          data: {
            // System roles can't be renamed — drop the field on the wire.
            ...(isSystem ? {} : { name: form.name.trim() }),
            description: form.description.trim() || null,
            permission_ids: form.permission_ids,
          },
        });
      } else {
        await create.mutateAsync({
          name: form.name.trim(),
          description: form.description.trim() || null,
          permission_ids: form.permission_ids,
        });
      }
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save the role.');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-lg border border-line-subtle bg-bg-elevated p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-h3 text-ink-primary">
            {mode === 'edit' ? 'Edit role' : 'New role'}
          </h2>
          {isSystem && (
            <span className="inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-secondary">
              <Lock className="size-3" /> System
            </span>
          )}
        </div>
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
          placeholder="manager"
          value={form.name}
          disabled={isSystem}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          helper={isSystem ? 'System roles cannot be renamed.' : 'Lowercase, short, e.g. "manager".'}
        />
        <Input
          label="Description (optional)"
          placeholder="Can manage products & orders"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-ink-secondary">
          Permissions ({form.permission_ids.length} selected)
        </p>
        <PermissionPicker
          permissions={permissions}
          selected={form.permission_ids}
          onChange={(ids) => setForm((f) => ({ ...f, permission_ids: ids }))}
          disabled={pending}
        />
      </div>

      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {mode === 'edit' ? 'Save changes' : 'Create role'}
        </Button>
      </div>
    </form>
  );
}

function RoleRow({ role, onEdit }) {
  const del = useDeleteRole();
  const [confirming, setConfirming] = useState(false);

  return (
    <tr className="border-t border-line-subtle">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink-primary">{role.name}</p>
          {role.is_system && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-fill px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-secondary"
              title="System role — locked"
            >
              <Lock className="size-3" /> System
            </span>
          )}
        </div>
        {role.description && (
          <p className="mt-0.5 text-xs text-ink-tertiary">{role.description}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
        {role.permissions?.length ?? 0}
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
                  del.mutate(role.id, { onSuccess: () => setConfirming(false) })
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
                aria-label={`Edit ${role.name}`}
                onClick={() => onEdit(role)}
                className="grid size-9 place-items-center rounded-sm text-ink-tertiary hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label={`Delete ${role.name}`}
                disabled={role.is_system}
                title={role.is_system ? 'System roles cannot be deleted' : undefined}
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

export default function AdminRolesPage() {
  const { data: roles = [], isLoading, isError, refetch } = useRoles();
  const { data: permissions = [], isLoading: permsLoading } = usePermissions();
  // null = closed, 'new' = creating, role obj = editing
  const [editing, setEditing] = useState(null);

  const isFormOpen = editing !== null;
  const formInitial =
    editing && editing !== 'new'
      ? {
          id: editing.id,
          name: editing.name,
          description: editing.description || '',
          permission_ids: editing.permissions?.map((p) => p.id) || [],
          is_system: editing.is_system,
        }
      : null;

  return (
    <AdminPage
      title="Roles & permissions"
      description={
        isLoading
          ? 'Loading…'
          : `${roles.length} role${roles.length === 1 ? '' : 's'} — assign to staff to control admin access.`
      }
      action={
        !isFormOpen && (
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" aria-hidden="true" />
            New role
          </Button>
        )
      }
    >
      {isFormOpen && (
        <RoleForm
          mode={editing === 'new' ? 'create' : 'edit'}
          initial={formInitial}
          permissions={permissions}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      {isError ? (
        <EmptyState
          icon={ShieldCheck}
          title="Couldn't load roles"
          description="Something went wrong. Please try again."
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading || permsLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No roles yet"
          description="The system roles should always exist — try restarting the API."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Permissions</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <RoleRow key={r.id} role={r} onEdit={setEditing} />
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs text-ink-tertiary">
            <UsersIcon className="size-3.5" />
            Assign roles to individual staff from the Users page.
          </p>
        </>
      )}
    </AdminPage>
  );
}
