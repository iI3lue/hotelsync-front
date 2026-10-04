import { Suspense } from "react";
import { fetchHotels, filterHotels } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import HotelCard from "@/components/HotelCard";
import SearchBar from "@/components/SearchBar";
import { SkeletonGrid } from "@/components/SkeletonCard";

async function HotelGrid({ city }: { city?: string }) {
  let hotels = [];
  try {
    hotels = await fetchHotels();
  } catch {
    return (
      <EmptyState
        title="No pudimos cargar los hoteles"
        description="El servicio de catálogo no responde. Verificá que el backend esté corriendo e intentá de nuevo."
      />
    );
  }

  const filtered = filterHotels(hotels, { city });
  if (filtered.length === 0) {
    return (
      <EmptyState
        title="No hay hoteles disponibles por el momento"
        description={
          city
            ? `No encontramos hoteles para “${city}”. Probá con otra ciudad o limpiá la búsqueda.`
            : "Todavía no hay hoteles cargados. Volvé a intentarlo más tarde."
        }
        actionHref="/buscar"
        actionLabel="Buscar con filtros"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((hotel) => (
        <HotelCard key={hotel.hotel_id} hotel={hotel} />
      ))}
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;
  return (
    <div>
      <section aria-labelledby="hero-title" className="mb-12">
        <div className="animate-hero-in overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 px-6 py-12 shadow-2xl sm:px-12 sm:py-16">
          <h1
            id="hero-title"
            className="max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl"
          >
            Encontrá tu estadía perfecta
          </h1>
          <p className="mt-5 mb-8 max-w-xl break-words text-lg leading-relaxed text-blue-100/85">
            Buscá por destino, elegí fechas y compará hoteles de toda la cadena
            en un solo lugar.
          </p>
          <SearchBar initialCity={city ?? ""} />
        </div>
      </section>

      <section aria-labelledby="listing-title">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="listing-title" className="text-2xl font-semibold text-balance">
            Nuestros hoteles
          </h2>
          <a
            href="/buscar"
            className="shrink-0 rounded px-3 py-1.5 text-sm font-medium text-blue-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
          >
            Búsqueda avanzada
          </a>
        </div>
        <Suspense fallback={<SkeletonGrid />}>
          <HotelGrid city={city} />
        </Suspense>
      </section>
    </div>
  );
}
