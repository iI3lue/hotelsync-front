/**
 * Shimmer skeleton card for hotel grid loading state.
 */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2.5xl bg-white shadow-card dark:bg-brand-navy-800" aria-hidden="true">
      {/* Image placeholder */}
      <div className="skeleton aspect-[4/3] w-full" />

      {/* Content */}
      <div className="p-5 space-y-3">
        <div className="skeleton h-2.5 w-1/3 rounded-full" />
        <div className="skeleton h-4 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />

        <div className="flex gap-2 pt-1">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>

        <div className="flex justify-between pt-3 items-center border-t border-gray-100 dark:border-white/6">
          <div className="skeleton h-4 w-20 rounded-full" />
          <div className="skeleton h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando hoteles…">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonCard;
