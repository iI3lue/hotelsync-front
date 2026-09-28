import Link from "next/link";
import { Suspense } from "react";
import { fetchHotels, filterHotels } from "@/lib/api";
import AdminFilters from "@/components/AdminFilters";
import ConfirmAction from "@/components/ConfirmAction";

async function HotelsTable({ query }: { query?: string }) {
  let hotels = [];
  try {
    hotels = await fetchHotels();
  } catch {
    return (
      <p role="alert" className="text-red-600 dark:text-red-400">
        No se pudo cargar el catálogo. Verificá que el backend esté corriendo.
      </p>
    );
  }

  const visible = filterHotels(hotels, query);
  if (visible.length === 0) {
    return (
      <div className="rounded-lg bg-white px-6 py-12 text-center shadow dark:bg-gray-800">
        <h2 className="mb-2 text-xl font-semibold text-balance">
          {query ? "Sin resultados para esta búsqueda" : "Todavía no hay hoteles"}
        </h2>
        <p className="mx-auto mb-6 max-w-md break-words text-gray-600 dark:text-gray-300">
          {query
            ? `No encontramos hoteles para “${query}”. Probá con otro término o limpiá el filtro.`
            : "Creá el primero para empezar a operar la cadena."}
        </p>
        {query ? (
          <Link
            href="/admin/hotels"
            className="inline-block rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 touch-manipulation"
          >
            Limpiar búsqueda
          </Link>
        ) : (
          <Link
            href="/admin/hotels/new"
            className="inline-block rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 touch-manipulation"
          >
            Crear el primer hotel
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <p role="status" className="px-6 pt-4 text-sm text-gray-600 tabular-nums dark:text-gray-300">
        {visible.length === 1 ? "1 hotel" : `${visible.length} hoteles`}
        {query ? ` para “${query}”` : ""}
      </p>
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300"
            >
              Nombre
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300"
            >
              Ciudad
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300"
            >
              País
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {visible.map((hotel) => (
            <tr key={hotel.hotel_id}>
              <td className="min-w-0 max-w-56 truncate px-6 py-4 font-medium">
                {hotel.name}
              </td>
              <td className="whitespace-nowrap px-6 py-4">{hotel.city}</td>
              <td className="whitespace-nowrap px-6 py-4">{hotel.country}</td>
              <td className="whitespace-nowrap px-6 py-4">
                <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-1">
                  <Link
                    href={`/admin/hotels/${hotel.hotel_id}`}
                    className="rounded px-2 py-1 text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/admin/hotels/${hotel.hotel_id}/rooms`}
                    className="rounded px-2 py-1 text-green-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 dark:text-green-400"
                  >
                    Habitaciones
                  </Link>
                  <Link
                    href={`/admin/hotels/${hotel.hotel_id}/inventory`}
                    className="rounded px-2 py-1 text-purple-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:text-purple-400"
                  >
                    Inventario
                  </Link>
                  <Link
                    href={`/admin/recepcion?hotel_id=${hotel.hotel_id}`}
                    className="rounded px-2 py-1 text-orange-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-orange-400"
                  >
                    Recepción
                  </Link>
                  <ConfirmAction
                    triggerLabel="Eliminar"
                    title={`Eliminar “${hotel.name}”`}
                    description="Esta acción es destructiva y no se puede deshacer. El endpoint de borrado aún no existe: cuando se implemente, esta confirmación lo protegerá."
                    confirmLabel="Entendido"
                    cancelLabel="Cerrar"
                  />
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
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-balance text-3xl font-bold">Hoteles</h1>
        <a
          href="/admin/hotels/new"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
        >
          Agregar hotel
        </a>
      </div>
      <div className="mb-6">
        <AdminFilters initialQuery={q ?? ""} />
      </div>
      <Suspense
        fallback={
          <div aria-hidden="true" className="animate-pulse rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <div className="mb-3 h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        }
      >
        <HotelsTable query={q} />
      </Suspense>
    </div>
  );
}
