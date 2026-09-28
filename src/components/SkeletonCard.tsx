const skeletonCard = (
  <div
    aria-hidden="true"
    className="animate-pulse rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
  >
    <div className="mb-4 aspect-video w-full rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mb-2 h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="mb-4 h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="h-9 w-28 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeletonCard}</div>
      ))}
    </div>
  );
}

export default function SkeletonCard() {
  return skeletonCard;
}
