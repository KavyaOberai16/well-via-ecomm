import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useCategories } from '@/features/categories/hooks.js';
import { useProducts } from '@/features/products/hooks.js';
import { cn } from '@/lib/utils.js';

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

function CategoryTile({ category, imageUrl }) {
  const gradient = gradientFor(category.slug);
  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.slug)}`}
      className="group/tile flex shrink-0 flex-col items-center gap-3 focus-visible:outline-none"
      aria-label={`Browse ${category.name}`}
    >
      <span
        className={cn(
          'relative grid size-24 place-items-center overflow-hidden rounded-full',
          'border border-line-subtle bg-gradient-to-br shadow-sm',
          'transition-transform duration-300 ease-out',
          'group-hover/tile:-translate-y-1 group-hover/tile:shadow-md',
          'group-focus-visible/tile:focus-ring',
          gradient,
        )}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
            aria-hidden="true"
          />
        ) : (
          <span className="text-xl font-semibold uppercase text-white/95 drop-shadow-sm">
            {category.name.trim().charAt(0)}
          </span>
        )}
      </span>
      <span className="max-w-[7rem] truncate text-center text-sm font-medium text-ink-secondary transition-colors group-hover/tile:text-ink-primary">
        {category.name}
      </span>
    </Link>
  );
}

export default function CategoryMarquee() {
  const reduce = useReducedMotion();
  const { data: categories = [] } = useCategories();
  // Pull a single page of products so we can show a real product image
  // per category. Cached by React Query, so we share it with HomePage.
  const { data: productsPage } = useProducts({ page: 1, page_size: 100 });

  const imageByCategoryId = useMemo(() => {
    const map = new Map();
    for (const p of productsPage?.items ?? []) {
      if (p.category_id && p.image_url && !map.has(p.category_id)) {
        map.set(p.category_id, p.image_url);
      }
    }
    return map;
  }, [productsPage]);

  if (!categories.length) return null;

  // Duplicate the list so a -50% translate loops seamlessly.
  const loop = [...categories, ...categories];

  return (
    <section className="mx-auto mt-16 max-w-content sm:mt-20" aria-labelledby="curated-heading">
      <header className="px-6 text-center">
        <h2 id="curated-heading" className="text-h2 text-ink-primary">
          Curated for You
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-secondary">
          Discover collections shaped by what you love.
        </p>
      </header>

      <div className="group relative mt-8 overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-bg-base to-transparent sm:w-24"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-bg-base to-transparent sm:w-24"
        />

        <ul
          className={cn(
            'flex w-max items-start gap-10 px-6 py-2 will-change-transform',
            !reduce && 'animate-marquee group-hover:[animation-play-state:paused]',
          )}
          role="list"
        >
          {loop.map((c, i) => (
            <li key={`${c.id}-${i}`} aria-hidden={i >= categories.length ? 'true' : undefined}>
              <CategoryTile category={c} imageUrl={imageByCategoryId.get(c.id)} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
