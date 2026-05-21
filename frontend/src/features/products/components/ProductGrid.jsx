import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/motion.js';
import { ProductCard } from './ProductCard.jsx';
import { ProductCardSkeleton } from './ProductCardSkeleton.jsx';

const GRID = 'grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4';

/** Responsive product grid with staggered reveal and a matching skeleton state. */
export function ProductGrid({ products = [], loading = false, onQuickAdd, skeletonCount = 8 }) {
  if (loading) {
    return (
      <div className={GRID}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={GRID}
      variants={staggerContainer(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onQuickAdd={onQuickAdd} />
      ))}
    </motion.div>
  );
}
