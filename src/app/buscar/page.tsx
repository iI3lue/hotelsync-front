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
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Disponible para tus fechas
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:border-brand-navy-700 dark:bg-brand-navy-900 dark:text-slate-300">
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
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-200 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                isActive
                  ? "border-brand-gold bg-brand-gold text-brand-navy shadow-sm hover:brightness-105"
                  : "border-slate-200 bg-white text-slate-700 hover:border-brand-gold/60 hover:text-brand-navy dark:border-brand-navy-700 dark:bg-brand-navy-800 dark:text-slate-200 dark:hover:border-brand-gold/60"
              }`}
            >
              {isActive ? `${filter} ✕` : filter}
            </a>
          );
        })}
        {params.amenity || params.city || params.guests || params.from ? (
          <a
            href="/buscar"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            Limpiar filtros
          </a>
        ) : null}
      </div>

      {canCheckStay ? (
        <div
          role="status"
          className="mb-4 flex items-center justify-between rounded-xl border border-brand-gold/30 bg-amber-50/60 px-4 py-3 text-sm text-brand-navy dark:border-brand-gold/20 dark:bg-brand-navy-800/80 dark:text-slate-200"
        >
          <span>Disponibilidad consultada para tu estancia.</span>
          <a
            href={clearDatesUrl(params)}
            className="font-semibold text-brand-gold underline underline-offset-2 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            Quitar fechas
          </a>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-brand-navy-800">
        <p role="status" className="text-sm font-medium text-slate-500 tabular-nums dark:text-slate-400">
          {visible.length === 0
            ? "Sin resultados"
            : visible.length === 1
              ? "1 hotel encontrado"
              : `${visible.length} hoteles encontrados`}
          {params.city ? ` para “${params.city}”` : ""}
          {params.from ? ` · desde ${params.from}` : ""}
          {params.to ? ` · hasta ${params.to}` : ""}
        </p>

        <div className="flex flex-wrap items-center gap-2" aria-label="Ordenar">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ordenar:</span>
          {[
            { value: "relevance", label: "Relevancia" },
            { value: "price-asc", label: "Precio: menor a mayor" },
            { value: "price-desc", label: "Precio: mayor a menor" },
          ].map((o) => (
            <a
              key={o.value}
              href={sortUrl(params, o.value)}
              aria-pressed={sort === o.value}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 touch-manipulation ${
                sort === o.value
                  ? "border-brand-navy bg-brand-navy text-white shadow-sm dark:border-brand-gold dark:bg-brand-gold dark:text-brand-navy font-semibold"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-brand-navy-700 dark:bg-brand-navy-800 dark:text-slate-200 dark:hover:bg-brand-navy-700"
              }`}
            >
              {o.label}
            </a>
          ))}
        </div>
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
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-brand-navy dark:text-white md:text-4xl">
          Explorá Hoteles
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Filtrá por destino, fechas y huéspedes con tarifas en tiempo real garantizadas.
        </p>
      </div>

      <div className="rounded-2.5xl border border-slate-200/80 bg-white p-2 shadow-card dark:border-brand-navy-700/80 dark:bg-brand-navy-800">
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
