import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, PackageX, AlertTriangle } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useProducts } from '@/features/products/hooks.js';
import { useDeleteProduct } from '@/features/admin/hooks.js';
import { formatPrice, stockLabel } from '@/lib/utils.js';

function ProductRow({ product }) {
  const [confirming, setConfirming] = useState(false);
  const del = useDeleteProduct();
  const stock = stockLabel(product.stock);

  return (
    <tr className="border-t border-line-subtle">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-ink-primary">{product.name}</p>
        <p className="text-xs text-ink-tertiary">{product.sku}</p>
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-primary">
        {formatPrice(product.price)}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-ink-secondary">
        {product.stock}
      </td>
      <td className="px-4 py-3">
        <Badge tone={stock.tone}>{stock.text}</Badge>
      </td>
      <td className="px-4 py-3">
        {confirming ? (
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-ink-secondary">Delete?</span>
            <Button
              variant="destructive"
              size="sm"
              loading={del.isPending}
              onClick={() => del.mutate(product.id)}
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
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/admin/products/${product.id}/edit`}
              aria-label={`Edit ${product.name}`}
              className="grid size-9 place-items-center rounded-sm text-ink-secondary transition-colors hover:bg-fill hover:text-ink-primary focus-visible:focus-ring"
            >
              <Pencil className="size-4" />
            </Link>
            <button
              type="button"
              aria-label={`Delete ${product.name}`}
              onClick={() => setConfirming(true)}
              className="grid size-9 place-items-center rounded-sm text-ink-tertiary transition-colors hover:bg-danger/10 hover:text-danger focus-visible:focus-ring"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminProductsPage() {
  const { data, isLoading, isError, refetch } = useProducts({ page: 1, page_size: 100 });
  const products = data?.items ?? [];

  return (
    <AdminPage
      title="Products"
      description={isLoading ? 'Loading…' : `${data?.total ?? 0} products in the catalog.`}
      action={
        <Link to="/admin/products/new">
          <Button size="sm">
            <Plus className="size-4" aria-hidden="true" />
            New product
          </Button>
        </Link>
      }
    >
      {isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="We couldn't load products"
          description="Something went wrong on our end. Please try again."
          action={
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={PackageX}
          title="No products yet"
          description="Add your first product to start building the catalog."
          action={
            <Link to="/admin/products/new">
              <Button size="sm">
                <Plus className="size-4" aria-hidden="true" />
                New product
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line-subtle bg-bg-elevated">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-tertiary">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPage>
  );
}
