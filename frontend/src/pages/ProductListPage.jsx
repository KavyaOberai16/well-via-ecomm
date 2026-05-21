import { useEffect, useState } from 'react';
import { Search, PackageX, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { ProductGrid } from '@/features/products/components/ProductGrid.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useProducts } from '@/features/products/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';

const PAGE_SIZE = 12;

export default function ProductListPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  // Debounce the search input so we do not refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, refetch } = useProducts({
    q: query || undefined,
    page,
    page_size: PAGE_SIZE,
  });
  const addToCart = useAddToCart();

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Page>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-h1 text-ink-primary">Shop</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            {isLoading ? 'Loading the collection…' : `${total} product${total === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Input
            type="search"
            label="Search"
            icon={Search}
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="mt-6">
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
        ) : !isLoading && products.length === 0 ? (
          <EmptyState
            icon={PackageX}
            title="No products found"
            description={
              query
                ? `Nothing matched "${query}". Try a different search.`
                : 'The catalog is being stocked. Check back shortly.'
            }
          />
        ) : (
          <ProductGrid
            products={products}
            loading={isLoading}
            skeletonCount={PAGE_SIZE}
            onQuickAdd={(p) => addToCart.mutate({ productId: p.id })}
          />
        )}
      </div>

      {!isLoading && !isError && totalPages > 1 && (
        <nav
          className="mt-10 flex items-center justify-center gap-3"
          aria-label="Pagination"
        >
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Button>
          <span className="text-sm text-ink-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </Page>
  );
}
