import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, AlertTriangle, Home } from 'lucide-react';
import { Page } from '@/components/layout/Page.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Badge } from '@/components/ui/Badge.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { EmptyState } from '@/components/feedback/EmptyState.jsx';
import {
  useProduct,
  useRelatedProducts,
  useCoPurchasedProducts,
  useLikelyProducts,
} from '@/features/products/hooks.js';
import { useCategories } from '@/features/categories/hooks.js';
import { stockLabel } from '@/lib/utils.js';
import { useTrackProductView } from '@/features/history/store.js';

import { GalleryAmz } from '@/features/products/components/GalleryAmz.jsx';
import { OfferStrip } from '@/features/products/components/OfferStrip.jsx';
import { AboutThisItem } from '@/features/products/components/AboutThisItem.jsx';
import { SpecTable } from '@/features/products/components/SpecTable.jsx';
import { BuyBox } from '@/features/products/components/BuyBox.jsx';
import { FrequentlyBoughtTogether } from '@/features/products/components/FrequentlyBoughtTogether.jsx';
import { ProductRail } from '@/features/products/components/ProductRail.jsx';
import { BrowsingHistoryRail } from '@/features/history/BrowsingHistoryRail.jsx';
import { StarRating } from '@/features/reviews/StarRating.jsx';
import { CustomerReviewsSection } from '@/features/reviews/CustomerReviewsSection.jsx';

/**
 * Amazon-style product detail page.
 *
 * Layout (>=lg):  | thumbs | main image | info + offers + bullets + spec | buy box |
 *   3 visual columns (gallery + info + buy box). Below the fold: FBT bundle,
 *   then "Customers also viewed" rail.
 *
 * Layout (<lg):  the columns stack — gallery, info, buy box, rails.
 *
 * The page treats `description` honestly: if a structured field doesn't exist
 * on the backend (reviews, MRP, variants) it's omitted rather than faked.
 */
export default function ProductDetailPage() {
  const { id } = useParams();
  const { data: product, isLoading, isError } = useProduct(id);
  const { data: related, isLoading: relatedLoading } = useRelatedProducts(id, 12);
  const { data: coPurchased, isLoading: coPurchasedLoading } = useCoPurchasedProducts(
    id,
    12,
  );
  const { data: likely, isLoading: likelyLoading } = useLikelyProducts(id, 12);
  const { data: categories } = useCategories();

  // Record the view for the "Your browsing history" rail on subsequent visits.
  useTrackProductView(id);

  const categoryName = useMemo(() => {
    if (!product?.category_id || !categories) return null;
    return categories.find((c) => c.id === product.category_id)?.name || null;
  }, [product?.category_id, categories]);

  if (isLoading) return <Loading />;
  if (isError || !product) return <NotFound />;

  const stock = stockLabel(product.stock);

  return (
    <Page>
      <Breadcrumbs product={product} categoryName={categoryName} />

      {/* Above the fold: gallery | info | buy box */}
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_320px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_360px]">
        {/* Gallery */}
        <section aria-label="Product images">
          <GalleryAmz product={product} />
        </section>

        {/* Info column */}
        <section aria-label="Product details" className="min-w-0">
          {categoryName && (
            <Link
              to={`/products?category_id=${product.category_id}`}
              className="text-sm text-accent hover:underline"
            >
              Visit the {categoryName} store
            </Link>
          )}
          <h1 className="mt-1 text-h2 text-ink-primary text-balance">{product.name}</h1>

          {/* Rating + count, anchor-links to the reviews section. */}
          {Number(product.rating_count) > 0 && (
            <a
              href="#reviews"
              className="mt-2 inline-flex items-center gap-2 rounded-sm text-sm text-ink-secondary hover:text-ink-primary focus-visible:focus-ring"
            >
              <StarRating value={Number(product.rating_avg) || 0} size="sm" />
              <span className="tabular-nums">
                {Number(product.rating_avg).toFixed(1)}
              </span>
              <span className="text-ink-tertiary">
                ({Number(product.rating_count).toLocaleString()} rating
                {product.rating_count === 1 ? '' : 's'})
              </span>
            </a>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {categoryName && (
              <Badge tone="accent" className="text-[11px]">
                {categoryName}
              </Badge>
            )}
            <Badge tone={stock.tone} className="text-[11px]">
              {stock.text}
            </Badge>
            <span className="text-xs text-ink-tertiary">SKU: {product.sku}</span>
          </div>

          <div className="mt-4 h-px bg-line-subtle" />

          <OfferStrip />

          <AboutThisItem product={product} categoryName={categoryName} />

          <SpecTable product={product} categoryName={categoryName} />
        </section>

        {/* Buy box */}
        <div>
          <BuyBox product={product} />
        </div>
      </div>

      <FrequentlyBoughtTogether
        product={product}
        related={related}
        isLoading={relatedLoading}
      />

      <ProductRail
        title="Related items bought by customers"
        products={coPurchased}
        isLoading={coPurchasedLoading}
      />

      <ProductRail
        title="Relevant items customers are likely to buy"
        products={likely}
        isLoading={likelyLoading}
      />

      <BrowsingHistoryRail excludeId={product.id} />

      <CustomerReviewsSection product={product} />
    </Page>
  );
}

function Breadcrumbs({ product, categoryName }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-xs text-ink-tertiary"
    >
      <Link to="/" className="inline-flex items-center gap-1 hover:text-ink-secondary">
        <Home className="size-3" aria-hidden="true" />
        Home
      </Link>
      <ChevronRight className="size-3" aria-hidden="true" />
      <Link to="/products" className="hover:text-ink-secondary">
        Shop
      </Link>
      {categoryName && (
        <>
          <ChevronRight className="size-3" aria-hidden="true" />
          <Link
            to={`/products?category_id=${product.category_id}`}
            className="hover:text-ink-secondary"
          >
            {categoryName}
          </Link>
        </>
      )}
      <ChevronRight className="size-3" aria-hidden="true" />
      <span className="truncate text-ink-secondary">{product.name}</span>
    </nav>
  );
}

function Loading() {
  return (
    <Page>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_320px]">
        <Skeleton className="aspect-square rounded-md" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </Page>
  );
}

function NotFound() {
  return (
    <Page>
      <EmptyState
        icon={AlertTriangle}
        title="Product not found"
        description="This product may have been removed or never existed."
        action={
          <Link to="/products">
            <Button size="sm">Back to shop</Button>
          </Link>
        }
      />
    </Page>
  );
}
