import type { Metadata } from "next";
import { Suspense } from "react";
import {
  applyStayAvailability,
  buildStockLookup,
  fetchHotels,
  filterHotels,
  minRate,
  rankHotelsByRelevance,
  stayNights,
  suggestHotel,
  withSearch,
  type SearchState,
  type StayAvailability,
} from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import HotelCard from "@/components/HotelCard";
import SearchBar from "@/components/SearchBar";
import { SkeletonGrid } from "@/components/SkeletonCard";

type BuscarParams = SearchState;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BuscarParams>;
}): Promise<Metadata> {
  const { city } = await searchParams;
  const base = "Buscar hoteles en HotelSync";
  return {
    title: city ? `${base} en ${city}` : base,
    description: city
      ? `Hoteles disponibles en ${city}. Compará precios, habitaciones y disponibilidad.`
      : "Buscá hoteles por destino, fechas y huéspedes. Compará precios y disponibilidad.",
  };
}

function toggleAmenityUrl(params: SearchState, amenity: string): string {
  const isActive = params.amenity?.toLowerCase() === amenity;
  return withSearch("/buscar", params, {
    amenity: isActive ? undefined : amenity,
  });
}

function sortUrl(params: SearchState, sort: string): string {
  return withSearch("/buscar", params, {
    sort: sort === "relevance" ? undefined : sort,
  });
}

function clearDatesUrl(params: SearchState): string {
  return withSearch("/buscar", params, { from: undefined, to: undefined });
}

const QUICK_FILTERS = ["wifi", "piscina", "desayuno", "vista al mar"];

/** Etiqueta de disponibilidad de un hotel para la estancia elegida. */
function StayBadge({ status }: { status: StayAvailability }) {
  if (status === "available") {
    return (
      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-200">
        Disponible para tus fechas
      </span>
    );
  }
  return (
    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
      Disponibilidad a confirmar
    </span>
  );
}

async function BuscarResults({ params }: { params: BuscarParams }) {
  let hotels = [];
  try {
    hotels = await fetchHotels();
  } catch {
    return (
      <EmptyState
        title="No pudimos cargar la búsqueda"
        description="El servicio de catálogo no responde. Verificá el backend e intentá de nuevo."
      />
    );
  }

  const minCapacity = params.minCap ? Number(params.minCap) : undefined;
  const guests = params.guests ? Number(params.guests) : undefined;
  const validGuests =
    guests && Number.isFinite(guests) && guests > 0 ? guests : undefined;

  const filtered = filterHotels(hotels, {
    city: params.city,
    amenity: params.amenity,
    minCapacity: Number.isFinite(minCapacity) ? minCapacity : undefined,
    guests: validGuests,
  });

  const sorted =
    params.sort === "price-asc"
      ? [...filtered].sort(
          (a, b) => (minRate(a) ?? Infinity) - (minRate(b) ?? Infinity)
        )
      : params.sort === "price-desc"
        ? [...filtered].sort(
            (a, b) => (minRate(b) ?? -Infinity) - (minRate(a) ?? -Infinity)
          )
        : rankHotelsByRelevance(filtered, params.city);

  // La disponibilidad ordena y, solo con evidencia real de agotado, excluye.
  const nights = stayNights(params.from, params.to);
  const canCheckStay = nights.length > 0 && nights.length <= 61;

  let visible = sorted;
  let status = new Map<string, StayAvailability>();
  if (canCheckStay) {
    const roomTypes = sorted.flatMap((h) => h.roomTypes ?? []);
    const stock = await buildStockLookup(roomTypes, params.from!, params.to!);
    ({ visible, status } = applyStayAvailability(sorted, {
      from: params.from,
      to: params.to,
      guests: validGuests,
      stock,
    }));
  }

  const sort = params.sort ?? "relevance";
  const search: SearchState = {
    city: params.city,
    from: params.from,
    to: params.to,
    guests: params.guests,
    amenity: params.amenity,
    minCap: params.minCap,
    sort: params.sort,
  };

  const suggestion =
    visible.length === 0 && !canCheckStay && params.city
      ? suggestHotel(hotels, params.city)
      : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Filtros rápidos">
        {QUICK_FILTERS.map((filter) => {
          const isActive = params.amenity?.toLowerCase() === filter;
          return (
            <a
              key={filter}
              href={toggleAmenityUrl(params, filter)}
              aria-pressed={isActive}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                isActive
                  ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {isActive ? `${filter} ✕` : filter}
            </a>
          );
        })}
        {params.amenity || params.city || params.guests || params.from ? (
          <a
            href="/buscar"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-blue-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
          >
            Limpiar filtros
          </a>
        ) : null}
      </div>

      {canCheckStay ? (
        <div
          role="status"
          className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100"
        >
          Disponibilidad consultada para tu estancia.
          <a
            href={clearDatesUrl(params)}
            className="ml-2 font-medium underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Quitar fechas
          </a>
        </div>
      ) : null}

      <p role="status" className="mb-4 text-sm text-gray-600 tabular-nums dark:text-gray-300">
        {visible.length === 0
          ? "Sin resultados"
          : visible.length === 1
            ? "1 hotel encontrado"
            : `${visible.length} hoteles encontrados`}
        {params.city ? ` para “${params.city}”` : ""}
        {params.from ? ` · desde ${params.from}` : ""}
        {params.to ? ` · hasta ${params.to}` : ""}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Ordenar">
        <span className="text-sm text-gray-600 dark:text-gray-300">Ordenar:</span>
        {[
          { value: "relevance", label: "Relevancia" },
          { value: "price-asc", label: "Precio: menor a mayor" },
          { value: "price-desc", label: "Precio: mayor a menor" },
        ].map((o) => (
          <a
            key={o.value}
            href={sortUrl(params, o.value)}
            aria-pressed={sort === o.value}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation ${
              sort === o.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            {o.label}
          </a>
        ))}
      </div>

      {visible.length === 0 ? (
        canCheckStay ? (
          <EmptyState
            title="Sin disponibilidad para estas fechas"
            description="No encontramos habitaciones libres para la estancia elegida. Probá con otras fechas o sin fechas para ver todos los hoteles."
            actionHref={clearDatesUrl(params)}
            actionLabel="Buscar sin fechas"
          />
        ) : suggestion ? (
          <div className="rounded-lg bg-white px-6 py-12 text-center shadow-md dark:bg-gray-800">
            <h2 className="mb-2 text-xl font-semibold text-balance">
              Sin resultados para “{params.city}”
            </h2>
            <p className="mx-auto mb-6 max-w-md break-words text-gray-600 dark:text-gray-300">
              ¿Quisiste decir{" "}
              <a
                href={withSearch("/buscar", search, {
                  city: suggestion.city,
                })}
                className="font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
              >
                {suggestion.city}
              </a>
              ?
            </p>
            <a
              href="/buscar"
              className="inline-block rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
            >
              Limpiar búsqueda
            </a>
          </div>
        ) : (
          <EmptyState
            title="Sin resultados para esta búsqueda"
            description="Probá con otra ciudad, quitá algún filtro o ampliá el rango de fechas."
            actionHref="/buscar"
            actionLabel="Limpiar búsqueda"
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((hotel) => (
            <HotelCard
              key={hotel.hotel_id}
              hotel={hotel}
              search={search}
              availability={status.get(hotel.hotel_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<BuscarParams>;
}) {
  const params = await searchParams;
  return (
    <div>
      <h1 className="mb-2 text-balance text-3xl font-bold">Buscar hoteles</h1>
      <p className="mb-6 max-w-2xl break-words text-gray-600 dark:text-gray-300">
        Filtrá por destino, fechas y huéspedes. La URL guarda tu búsqueda para
        compartirla o volver atrás sin perderla.
      </p>
      <div className="mb-8">
        <SearchBar
          initialCity={params.city ?? ""}
          initialFrom={params.from ?? ""}
          initialTo={params.to ?? ""}
          initialGuests={params.guests ?? "2"}
        />
      </div>
      <Suspense fallback={<SkeletonGrid />}>
        <BuscarResults params={params} />
      </Suspense>
    </div>
  );
}
