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
import Breadcrumbs from "@/components/Breadcrumbs";
import { amenityLabel } from "@/components/ui/Amenity";
import { SkeletonGrid } from "@/components/SkeletonCard";

type BuscarParams = SearchState;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BuscarParams>;
}): Promise<Metadata> {
  const { city } = await searchParams;
  const base = "Hoteles y destinos";
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

  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.8125rem] transition-colors duration-300 touch-manipulation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold ${
      active
        ? "border-brand-navy bg-brand-navy text-white dark:border-white dark:bg-white dark:text-brand-navy"
        : "border-brand-navy/20 text-brand-navy/75 hover:border-brand-navy hover:text-brand-navy dark:border-white/20 dark:text-white/70 dark:hover:border-white dark:hover:text-white"
    }`;

  const hasFilters = Boolean(params.amenity || params.city || params.guests || params.from);

  return (
    <div>
      {/* Filtros + orden */}
      <div className="flex flex-col gap-6 border-b border-brand-navy/12 pb-6 dark:border-white/12 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtros rápidos">
          {QUICK_FILTERS.map((filter) => {
            const isActive = params.amenity?.toLowerCase() === filter;
            return (
              <a key={filter} href={toggleAmenityUrl(params, filter)} aria-pressed={isActive} className={chip(isActive)}>
                {amenityLabel(filter)}
                {isActive && (
                  <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.2" /></svg>
                )}
              </a>
            );
          })}
          {hasFilters ? (
            <a href="/buscar" className="ml-2 text-eyebrow uppercase text-brand-navy/60 underline-offset-4 hover:text-brand-navy hover:underline dark:text-white/55 dark:hover:text-white">
              Limpiar todo
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Ordenar">
          <span className="eyebrow">Ordenar</span>
          {[
            { value: "relevance", label: "Relevancia" },
            { value: "price-asc", label: "Menor precio" },
            { value: "price-desc", label: "Mayor precio" },
          ].map((o) => (
            <a
              key={o.value}
              href={sortUrl(params, o.value)}
              aria-pressed={sort === o.value}
              className={`relative py-1 text-[0.875rem] transition-colors ${
                sort === o.value
                  ? "text-brand-navy after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-current dark:text-white"
                  : "text-brand-navy/50 hover:text-brand-navy dark:text-white/50 dark:hover:text-white"
              }`}
            >
              {o.label}
            </a>
          ))}
        </div>
      </div>

      {/* Resumen de la búsqueda */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 py-8">
        <p role="status" className="font-display text-[1.6rem] text-brand-navy dark:text-white">
          {visible.length === 0
            ? "Sin resultados"
            : visible.length === 1
              ? "1 hotel"
              : `${visible.length} hoteles`}
          {params.city ? <span className="text-brand-navy/50 dark:text-white/50"> en {params.city}</span> : null}
        </p>
        {canCheckStay ? (
          <p className="text-[0.875rem] text-brand-navy/60 dark:text-white/55">
            Disponibilidad real para {nights.length} {nights.length === 1 ? "noche" : "noches"}
            {validGuests ? ` · ${validGuests} ${validGuests === 1 ? "huésped" : "huéspedes"}` : ""}
            <a href={clearDatesUrl(params)} className="ml-4 text-eyebrow uppercase text-brand-navy underline underline-offset-4 dark:text-white">
              Quitar fechas
            </a>
          </p>
        ) : (
          <p className="text-[0.875rem] text-brand-navy/55 dark:text-white/50">
            Elegí fechas para ver disponibilidad real.
          </p>
        )}
      </div>

      {visible.length === 0 ? (
        canCheckStay ? (
          <EmptyState
            title="Sin disponibilidad para estas fechas"
            description="No encontramos habitaciones libres para la estancia elegida. Probá con otras fechas o buscá sin fechas para ver todos los hoteles."
            actionHref={clearDatesUrl(params)}
            actionLabel="Buscar sin fechas"
          />
        ) : suggestion ? (
          <EmptyState
            title={`Sin resultados para “${params.city}”`}
            description="Quizás quisiste buscar otro destino:"
            actionHref="/buscar"
            actionLabel="Limpiar búsqueda"
          >
            <a
              href={withSearch("/buscar", search, { city: suggestion.city })}
              className="mt-4 inline-block font-display text-[1.75rem] text-brand-navy underline decoration-brand-gold decoration-1 underline-offset-8 hover:decoration-brand-navy dark:text-white"
            >
              {suggestion.city}
            </a>
          </EmptyState>
        ) : (
          <EmptyState
            title="Sin resultados para esta búsqueda"
            description="Probá con otra ciudad, quitá algún filtro o ampliá el rango de fechas."
            actionHref="/buscar"
            actionLabel="Limpiar búsqueda"
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-x-10 gap-y-20 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((hotel, i) => (
            <HotelCard
              key={hotel.hotel_id}
              hotel={hotel}
              search={search}
              index={i}
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
      <section className="shell pb-12 pt-12 md:pt-20">
        <Breadcrumbs items={[{ label: "Hoteles y destinos" }]} />
        <div className="mt-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <h1 className="font-display text-display-md text-brand-navy dark:text-white">
            {params.city ? (
              <>
                <span className="mask-line"><span>Hoteles en</span></span>
                <span className="mask-line"><span style={{ ["--d" as string]: "100ms" }}>{params.city}</span></span>
              </>
            ) : (
              <>
                <span className="mask-line"><span>¿A dónde</span></span>
                <span className="mask-line"><span style={{ ["--d" as string]: "100ms" }}>te llevamos?</span></span>
              </>
            )}
          </h1>
          <p className="max-w-xs animate-fade-in text-[0.95rem] text-brand-navy/60 dark:text-white/55" style={{ animationDelay: "300ms" }}>
            Destino, fechas y huéspedes. Te mostramos solo lo que está libre de verdad.
          </p>
        </div>
      </section>

      <div className="shell relative z-20 animate-slide-up" style={{ animationDelay: "200ms" }}>
        <SearchBar
          initialCity={params.city ?? ""}
          initialFrom={params.from ?? ""}
          initialTo={params.to ?? ""}
          initialGuests={params.guests ?? "2"}
        />
      </div>

      <section className="shell pt-12">
        <Suspense fallback={<SkeletonGrid />}>
          <BuscarResults params={params} />
        </Suspense>
      </section>
    </div>
  );
}
