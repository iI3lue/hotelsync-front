/**
 * Esqueleto de carga para el listado de hoteles.
 */
function SkeletonCard() {
  return (
    <div aria-hidden="true">
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="space-y-3 pt-6">
        <div className="skeleton h-2.5 w-1/3" />
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando hoteles…">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default SkeletonCard;
