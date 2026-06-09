import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCategories } from '@/features/categories/hooks.js';
import { useProducts } from '@/features/products/hooks.js';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { cn } from '@/lib/utils.js';
import { fadeUp, staggerContainer } from '@/lib/motion.js';

const GRADIENTS = [
  'from-rose-300 to-amber-200',
  'from-indigo-300 to-sky-200',
  'from-emerald-300 to-lime-200',
  'from-fuchsia-300 to-pink-200',
  'from-amber-300 to-yellow-200',
  'from-teal-300 to-cyan-200',
  'from-violet-300 to-indigo-200',
  'from-orange-300 to-rose-200',
];

function gradientFor(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[h % GRADIENTS.length];
}

function CategoryCircle({ category, imageUrl }) {
  const gradient = gradientFor(category.slug);
  // Fall back to the initial if the image URL fails to load (e.g. a stale
  // product-derived URL that 404s) instead of showing a broken-image glyph.
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = imageUrl && !imgFailed;
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.slug)}`}
      className="group flex flex-col items-center gap-3 focus-visible:outline-none"
      aria-label={`Browse ${category.name}`}
    >
      <span
        className={cn(
          'relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full sm:size-20',
          'border border-line-subtle bg-gradient-to-br shadow-sm',
          'transition-all duration-300 ease-out',
          'group-hover:-translate-y-1 group-hover:shadow-md group-hover:ring-2 group-hover:ring-accent/30',
          'group-focus-visible:focus-ring',
          gradient,
        )}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="size-full object-cover"
            aria-hidden="true"
          />
        ) : (
          <span className="text-lg font-semibold uppercase text-white/95 drop-shadow-sm sm:text-xl">
            {category.name.trim().charAt(0)}
          </span>
        )}
      </span>
      <span className="max-w-[6rem] truncate text-center text-xs font-medium text-ink-secondary transition-colors group-hover:text-ink-primary sm:max-w-[7rem] sm:text-sm">
        {category.name}
      </span>
    </Link>
  );
}

function CategoryCircleSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Skeleton className="size-16 rounded-full sm:size-20" />
      <Skeleton className="h-3.5 w-16 rounded-sm" />
    </div>
  );
}

/**
 * "Curated for You" section — a row of circular category shortcuts.
 * Renders nothing if categories are not yet loaded or the list is empty.
 */
export default function CategoryCircles() {
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: productsPage, isLoading: prodsLoading } = useProducts({ page: 1, page_size: 100 });

  const imageByCategoryId = useMemo(() => {
    const map = new Map();
    for (const p of productsPage?.items ?? []) {
      if (p.category_id && p.image_url && !map.has(p.category_id)) {
        map.set(p.category_id, p.image_url);
      }
    }
    return map;
  }, [productsPage]);

  const isLoading = catsLoading || prodsLoading;

  // Once loaded: if zero categories, render nothing
  if (!isLoading && categories.length === 0) return null;

  // Limit to first 10 categories
  const visible = categories.slice(0, 10);

  return (
    <section
      className="mx-auto mt-16 max-w-content px-4 sm:mt-20 sm:px-6"
      aria-labelledby="curated-heading"
    >
      <motion.header
        className="text-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
      >
        <h2 id="curated-heading" className="text-h2 text-ink-primary">
          Curated for You
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-secondary">
          Browse our most-loved collections.
        </p>
      </motion.header>

      {isLoading ? (
        /* Skeleton row while loading */
        <div className="mt-8 flex items-start justify-center gap-6 overflow-x-auto pb-2 sm:gap-8 [&::-webkit-scrollbar]:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0">
              <CategoryCircleSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="mt-8 flex flex-wrap items-start justify-center gap-5 overflow-x-auto pb-2 sm:gap-8 [&::-webkit-scrollbar]:hidden"
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          role="list"
        >
          {visible.map((category) => (
            <motion.div key={category.id} variants={fadeUp} role="listitem" className="shrink-0">
              <CategoryCircle
                category={category}
                imageUrl={category.image_url || imageByCategoryId.get(category.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
