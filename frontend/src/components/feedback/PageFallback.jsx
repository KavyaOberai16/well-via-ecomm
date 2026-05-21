import { Skeleton } from '@/components/ui/Skeleton.jsx';

/** Suspense fallback for lazily-loaded routes — matches typical page layout. */
export function PageFallback() {
  return (
    <div className="mx-auto w-full max-w-content px-6 py-12">
      <Skeleton className="h-10 w-64 rounded-sm" />
      <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
        ))}
      </div>
    </div>
  );
}
