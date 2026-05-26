import { useState } from 'react';
import { Tags, Plus, Trash2 } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from '@/features/categories/hooks.js';

function CategoryRow({ category }) {
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteCategory();

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-primary">{category.name}</p>
        <p className="text-xs text-ink-tertiary">/{category.slug}</p>
      </div>
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-secondary">Delete?</span>
          <Button
            variant="destructive"
            size="sm"
            loading={del.isPending}
            onClick={() => del.mutate(category.id)}
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
        </div>
      ) : (
        <button
          type="button"
          aria-label={`Delete ${category.name}`}
          onClick={() => setConfirming(true)}
          className="grid size-9 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const create = useCreateCategory();
  const [name, setName] = useState('');
  const [error, setError] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Enter a category name.');
      return;
    }
    try {
      await create.mutateAsync({ name: name.trim() });
      setName('');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not create the category.');
    }
  }

  return (
    <AdminPage
      title="Categories"
      description="Group products for browsing and filtering. Deleting a category leaves its products uncategorized."
    >
      <form onSubmit={handleAdd} className="mb-6 flex items-start gap-3">
        <div className="flex-1">
          <Input
            placeholder="New category name — e.g. Accessories"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={error}
          />
        </div>
        <Button type="submit" loading={create.isPending}>
          <Plus className="size-4" aria-hidden="true" />
          Add category
        </Button>
      </form>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Add your first category with the form above."
        />
      ) : (
        <ul className="divide-y divide-line-subtle rounded-lg border border-line-subtle bg-bg-elevated">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
