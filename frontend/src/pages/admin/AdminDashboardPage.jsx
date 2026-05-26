import { Link } from 'react-router-dom';
import { Package, DollarSign, PackageX, TriangleAlert, Plus, ArrowRight } from 'lucide-react';
import { AdminPage } from '@/components/admin/AdminPage.jsx';
import { StatCard } from '@/components/admin/StatCard.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { useProducts } from '@/features/products/hooks.js';
import { formatPrice, stockLabel } from '@/lib/utils.js';

export default function AdminDashboardPage() {
  const { data, isLoading } = useProducts({ page: 1, page_size: 100 });
  const products = data?.items ?? [];

  const totalProducts = data?.total ?? 0;
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price) * p.stock,
    0,
  );
  const outOfStock = products.filter((p) => p.stock <= 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const attention = [...outOfStock, ...lowStock];

  return (
    <AdminPage
      title="Dashboard"
      description="An overview of your catalog."
      action={
        <Link to="/admin/products/new">
          <Button size="sm">
            <Plus className="size-4" aria-hidden="true" />
            New product
          </Button>
        </Link>
      }
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Products"
          value={totalProducts}
          tone="accent"
          loading={isLoading}
        />
        <StatCard
          icon={DollarSign}
          label="Inventory value"
          value={formatPrice(inventoryValue)}
          tone="success"
          loading={isLoading}
        />
        <StatCard
          icon={PackageX}
          label="Out of stock"
          value={outOfStock.length}
          tone="danger"
          loading={isLoading}
        />
        <StatCard
          icon={TriangleAlert}
          label="Low stock"
          value={lowStock.length}
          tone="warning"
          loading={isLoading}
        />
      </div>

      {/* Needs attention */}
      <section className="mt-8 rounded-lg border border-line-subtle bg-bg-elevated">
        <header className="flex items-center justify-between gap-4 border-b border-line-subtle px-5 py-4">
          <h2 className="text-h3 text-ink-primary">Needs attention</h2>
          <Link
            to="/admin/products"
            className="flex items-center gap-1 rounded-sm text-sm text-accent transition-colors hover:text-accent-hover focus-visible:focus-ring"
          >
            All products
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </header>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : attention.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-secondary">
            Every product is well stocked.
          </p>
        ) : (
          <ul className="divide-y divide-line-subtle">
            {attention.map((p) => {
              const stock = stockLabel(p.stock);
              return (
                <li key={p.id}>
                  <Link
                    to={`/admin/products/${p.id}/edit`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-fill focus-visible:focus-ring"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-primary">
                      {p.name}
                    </span>
                    <span className="text-xs text-ink-tertiary">{p.sku}</span>
                    <Badge tone={stock.tone}>{stock.text}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AdminPage>
  );
}
