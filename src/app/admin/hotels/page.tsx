import Link from "next/link";
import { Suspense } from "react";
import { fetchHotels, filterHotels } from "@/lib/api";
import { getSessionScope } from "@/lib/server-session";
import AdminFilters from "@/components/AdminFilters";
import ConfirmAction from "@/components/ConfirmAction";

async function HotelsTable({
  query,
  scopeHotelId,
  canManageChain,
}: {
  query?: string;
  /** Si se indica (manager), solo se muestra ese hotel. */
  scopeHotelId?: string | null;
  /** Crear/eliminar hoteles es solo SUPER_ADMIN. */
  canManageChain: boolean;
}) {
  let hotels = [];
  try {
    hotels = await fetchHotels();
  } catch {
    return (
      <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50/90 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
        <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="font-medium">No se pudo cargar el catálogo. Verificá que el backend esté corriendo.</p>
      </div>
    );
  }

  const scoped = scopeHotelId
    ? hotels.filter((h) => h.hotel_id === scopeHotelId)
    : hotels;
  const visible = filterHotels(scoped, query);

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-12 text-center dark:border-white/10 dark:bg-brand-navy-800/40">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gold/10 text-2xl">
          🏨
        </div>
        <h2 className="mb-2 text-xl font-bold text-brand-navy dark:text-white">
          {query ? "Sin resultados para esta búsqueda" : "Todavía no hay hoteles"}
        </h2>
        <p className="mx-auto mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
          {query
            ? `No encontramos hoteles para "${query}". Probá con otro término o limpiá el filtro.`
            : "Creá el primero para empezar a operar la cadena."}
        </p>
        {query ? (
          <Link
            href="/admin/hotels"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
          >
            Limpiar búsqueda
          </Link>
        ) : canManageChain ? (
          <Link
            href="/admin/hotels/new"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-navy-900 active:scale-95 dark:bg-brand-gold dark:text-brand-navy"
          >
            + Crear primer hotel
          </Link>
        ) : (
          <p className="mx-auto mb-6 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Tu cuenta aún no tiene un hotel asignado.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200/80 bg-white shadow-xs dark:border-white/10 dark:bg-brand-navy-800">
      <p role="status" className="border-b border-gray-100 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 tabular-nums dark:border-white/10 dark:text-gray-400">
        {visible.length === 1 ? "1 hotel" : `${visible.length} hoteles`}
        {query ? ` para "${query}"` : ""}
      </p>
      <table className="w-full">
        <thead className="bg-gray-50/80 dark:bg-white/5">
          <tr>
            <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Ciudad</th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">País</th>
            <th scope="col" className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {visible.map((hotel) => (
            <tr key={hotel.hotel_id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
              <td className="min-w-0 max-w-56 px-5 py-3.5">
                <span className="block truncate text-sm font-semibold text-brand-navy dark:text-white">{hotel.name}</span>
              </td>
              <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{hotel.city}</td>
              <td className="whitespace-nowrap px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{hotel.country}</td>
              <td className="whitespace-nowrap px-5 py-3.5">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/admin/hotels/${hotel.hotel_id}`}
                    className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/admin/hotels/${hotel.hotel_id}/rooms`}
                    className="inline-flex items-center rounded-lg border border-brand-gold/30 px-3 py-1 text-xs font-semibold text-brand-navy transition-colors hover:bg-brand-gold/10 dark:text-brand-gold dark:hover:bg-brand-gold/10"
                  >
                    Habitaciones
                  </Link>
                  <Link
                    href={`/admin/hotels/${hotel.hotel_id}/inventory`}
                    className="inline-flex items-center rounded-lg border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-50 dark:border-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-950/20"
                  >
                    Inventario
                  </Link>
                  <Link
                    href={`/admin/recepcion?hotel_id=${hotel.hotel_id}`}
                    className="inline-flex items-center rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-950/20"
                  >
                    Recepción
                  </Link>
                  {canManageChain ? (
                    <ConfirmAction
                      triggerLabel="Eliminar"
                      title={`Eliminar "${hotel.name}"`}
                      description="Esta acción es destructiva y no se puede deshacer. El endpoint de borrado aún no existe: cuando se implemente, esta confirmación lo protegerá."
                      confirmLabel="Entendido"
                      cancelLabel="Cerrar"
                    />
                  ) : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await getSessionScope();
  // El manager solo opera su hotel asignado (crear hoteles es SUPER_ADMIN).
  const isManager = session.role === "MANAGER";
  const scopeHotelId = isManager ? session.hotel_id : null;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-3xl">
            Hoteles
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isManager
              ? "Tu hotel asignado y sus configuraciones."
              : "Administrá la cadena de propiedades y sus configuraciones."}
          </p>
        </div>
        {isManager ? null : (
          <Link
            href="/admin/hotels/new"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-navy px-4 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-navy-900 active:scale-95 dark:bg-brand-gold dark:text-brand-navy dark:hover:bg-brand-gold-dark"
          >
            + Agregar hotel
          </Link>
        )}
      </div>

      <AdminFilters initialQuery={q ?? ""} />

      <Suspense
        fallback={
          <div aria-hidden="true" className="animate-pulse rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs dark:border-white/10 dark:bg-brand-navy-800">
            <div className="mb-3 h-4 w-1/3 rounded-lg bg-gray-200 dark:bg-white/10" />
            <div className="h-10 rounded-lg bg-gray-200 dark:bg-white/10" />
          </div>
        }
      >
        <HotelsTable query={q} scopeHotelId={scopeHotelId} canManageChain={!isManager} />
      </Suspense>
    </div>
  );
}
