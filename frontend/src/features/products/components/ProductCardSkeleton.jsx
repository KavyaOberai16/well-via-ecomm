import { Skeleton } from '@/components/ui/Skeleton.jsx';

/** Skeleton that mirrors ProductCard's layout dimensions exactly. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-line-subtle bg-bg-elevated">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-1 h-6 w-20" />
      </div>
    </div>
  );
}
