import type { Metadata } from "next";
import { Suspense } from "react";
import { fetchHotels, filterHotels, minRate, rankHotelsByRelevance, suggestHotel } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import HotelCard from "@/components/HotelCard";
import SearchBar from "@/components/SearchBar";
import { SkeletonGrid } from "@/components/SkeletonCard";

interface BuscarParams {
  city?: string;
  from?: string;
  to?: string;
  guests?: string;
  amenity?: string;
  minCap?: string;
  sort?: string;
}

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

function toggleAmenityUrl(params: BuscarParams, amenity: string): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "amenity") next.set(key, value);
  }
  if (params.amenity?.toLowerCase() !== amenity) next.set("amenity", amenity);
  const query = next.toString();
  return query ? `/buscar?${query}` : "/buscar";
}

function sortUrl(params: BuscarParams, sort: string): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "sort") next.set(key, value);
  }
  if (sort !== "relevance") next.set("sort", sort);
  const query = next.toString();
  return query ? `/buscar?${query}` : "/buscar";
}

const QUICK_FILTERS = ["wifi", "piscina", "desayuno", "vista al mar"];

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
  const filtered = filterHotels(hotels, {
    city: params.city,
    amenity: params.amenity,
    minCapacity: Number.isFinite(minCapacity) ? minCapacity : undefined,
  });

  const guests = params.guests ? Number(params.guests) : undefined;
  const guestFiltered =
    guests && Number.isFinite(guests) && guests > 0
      ? filtered.filter((h) =>
          (h.roomTypes ?? []).some((r) => r.capacity >= guests)
        )
      : filtered;

  const visible =
    params.sort === "price-asc"
      ? [...guestFiltered].sort(
          (a, b) => (minRate(a) ?? Infinity) - (minRate(b) ?? Infinity)
        )
      : params.sort === "price-desc"
        ? [...guestFiltered].sort(
            (a, b) => (minRate(b) ?? -Infinity) - (minRate(a) ?? -Infinity)
          )
        : rankHotelsByRelevance(guestFiltered, params.city);

  const sort = params.sort ?? "relevance";

  const suggestion =
    visible.length === 0 && params.city
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
        {params.amenity || params.city || params.guests ? (
          <a
            href="/buscar"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-blue-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
          >
            Limpiar filtros
          </a>
        ) : null}
      </div>

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
          suggestion ? (
            <div className="rounded-lg bg-white px-6 py-12 text-center shadow-md dark:bg-gray-800">
              <h2 className="mb-2 text-xl font-semibold text-balance">
                Sin resultados para “{params.city}”
              </h2>
              <p className="mx-auto mb-6 max-w-md break-words text-gray-600 dark:text-gray-300">
                ¿Quisiste decir{" "}
                <a
                  href={`/buscar?city=${encodeURIComponent(suggestion.city)}`}
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
            <HotelCard key={hotel.hotel_id} hotel={hotel} />
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
