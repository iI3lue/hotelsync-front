/**
 * Skeleton instantáneo para la página de reserva: mantiene la grilla
 * (formulario + resumen) para que el contenido no salte al cargar.
 */
export default function Loading() {
  return (
    <div aria-hidden="true">
      <div className="shell pb-12 pt-12 md:pb-16 md:pt-20">
        <div className="skeleton h-3 w-48" />
        <div className="mt-10 border-b border-brand-navy/12 pb-12 dark:border-white/12">
          <div className="skeleton h-3 w-40" />
          <div className="skeleton mt-5 h-14 w-full max-w-lg" />
          <div className="skeleton mt-6 h-4 w-full max-w-md" />
        </div>
      </div>
      <div className="shell grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14">
        <div className="space-y-5 border border-brand-navy/10 p-6 dark:border-white/10 md:p-10">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-8 w-56" />
          <div className="skeleton h-72 w-full" />
        </div>
        <div className="space-y-4">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
