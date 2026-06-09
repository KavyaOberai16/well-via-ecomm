import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, PackageX, AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { ProductGrid } from '@/features/products/components/ProductGrid.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import { useProducts } from '@/features/products/hooks.js';
import { useCategories } from '@/features/categories/hooks.js';
import { useAddToCart } from '@/features/cart/hooks.js';

const PAGE_SIZE = 12;

export default function ProductListPage() {
  const [searchParams] = useSearchParams();
  // The catalog can be filtered by category via either URL shape:
  //   ?category_id=<id>   (used by product-detail "Visit the X store" links)
  //   ?category=<slug>    (used by the homepage category circles)
  const categoryIdParam = searchParams.get('category_id');
  const categorySlug = searchParams.get('category');

  const { data: categories = [] } = useCategories();

  const activeCategory = useMemo(() => {
    if (categoryIdParam) {
      const id = Number(categoryIdParam);
      return categories.find((c) => c.id === id) || (Number.isFinite(id) ? { id, name: null } : null);
    }
    if (categorySlug) {
      return categories.find((c) => c.slug === categorySlug) || null;
    }
    return null;
  }, [categoryIdParam, categorySlug, categories]);

  const categoryId = activeCategory?.id;

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

  // Reset to the first page whenever the active category changes.
  useEffect(() => {
    setPage(1);
  }, [categoryId, categorySlug]);

  const { data, isLoading, isError, refetch } = useProducts({
    q: query || undefined,
    category_id: categoryId,
    page,
    page_size: PAGE_SIZE,
  });
  const addToCart = useAddToCart();

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const isFiltered = !!(categoryIdParam || categorySlug);
  const heading = activeCategory?.name || (isFiltered ? 'Category' : 'Shop');

  return (
    <Page>
      <Breadcrumbs
        items={isFiltered ? [{ label: 'Shop', to: '/products' }] : []}
        current={heading}
        className="mb-6"
      />
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-h1 text-ink-primary">{heading}</h1>
            {isFiltered && (
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 rounded-full border border-line-subtle bg-fill px-3 py-1 text-xs font-medium text-ink-secondary transition-colors hover:text-ink-primary focus-visible:focus-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
                Clear filter
              </Link>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-secondary">
            {isLoading
              ? 'Loading the collection…'
              : `${total} product${total === 1 ? '' : 's'}${
                  activeCategory?.name ? ` in ${activeCategory.name}` : ''
                }`}
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
                : activeCategory?.name
                  ? `No products in ${activeCategory.name} yet. Check back shortly.`
                  : 'The catalog is being stocked. Check back shortly.'
            }
            action={
              isFiltered ? (
                <Link to="/products">
                  <Button size="sm" variant="secondary">
                    View all products
                  </Button>
                </Link>
              ) : undefined
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
