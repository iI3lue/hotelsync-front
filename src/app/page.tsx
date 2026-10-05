import { Suspense } from "react";
import { fetchHotels, filterHotels } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import HotelCard from "@/components/HotelCard";
import SearchBar from "@/components/SearchBar";
import { SkeletonGrid } from "@/components/SkeletonCard";

async function HotelGrid({ city }: { city?: string }) {
  let hotels: Awaited<ReturnType<typeof fetchHotels>> = [];
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
            ? `No encontramos hoteles para "${city}". Probá con otra ciudad o limpiá la búsqueda.`
            : "Todavía no hay hoteles cargados. Volvé a intentarlo más tarde."
        }
        actionHref="/buscar"
        actionLabel="Buscar con filtros"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((hotel, i) => (
        <div
          key={hotel.hotel_id}
          className={`animate-slide-up-${Math.min(i + 1, 6) as 1 | 2 | 3 | 4 | 5 | 6}`}
        >
          <HotelCard hotel={hotel} />
        </div>
      ))}
    </div>
  );
}

/* ─── Features strip ─────────────────────────────────────────── */
function FeaturesStrip() {
  const features = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      title: "Reserva segura",
      desc: "Confirmación instantánea y control de inventario en tiempo real sin sobreventa.",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
      title: "Fechas flexibles",
      desc: "Visualizá disponibilidad en tiempo real con calendario interactivo y elegí tu mejor opción.",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      title: "Sin sorpresas",
      desc: "Precio final transparente antes de confirmar. Tarifas directas y políticas claras.",
    },
  ];

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
      {features.map((f, i) => (
        <div
          key={f.title}
          className={`animate-slide-up-${(i + 1) as 1 | 2 | 3} rounded-2xl border border-brand-navy/6 bg-white p-6 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 dark:border-white/6 dark:bg-brand-navy-800`}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
            {f.icon}
          </div>
          <h3 className="mb-1 font-semibold text-brand-navy dark:text-white">{f.title}</h3>
          <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city } = await searchParams;

  return (
    <div className="space-y-12">
      {/* ── 1. Hero con barra de búsqueda ── */}
      <section
        aria-labelledby="hero-title"
        className="relative bg-hero-gradient"
      >
        {/* Orbes decorativos contenidos en un wrapper interno: el overflow
            va acá y NO en la sección, para no recortar los desplegables
            del SearchBar (destino, fechas, huéspedes). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-brand-gold/6 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pb-20 sm:pt-24">
          {/* Eyebrow */}
          <div className="animate-slide-up mb-4 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-gold" />
            <span className="text-xs font-semibold tracking-wider text-brand-gold uppercase">
              Plataforma hotelera premium
            </span>
          </div>

          <h1
            id="hero-title"
            className="animate-slide-up-1 max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            Encontrá tu{" "}
            <span className="gradient-text">estadía perfecta</span>
          </h1>

          <p className="animate-slide-up-2 mt-4 max-w-xl text-base leading-relaxed text-blue-100/80 sm:text-lg">
            Buscá por destino, elegí fechas y compará hoteles de toda la cadena
            en un solo lugar. Reserva confirmada en segundos.
          </p>

          <div className="animate-slide-up-3 mt-8">
            <SearchBar initialCity={city ?? ""} heroMode />
          </div>
        </div>
      </section>

      {/* ── 2. Nuestros Hoteles: seguido inmediatamente de la barra de búsqueda ── */}
      <section aria-labelledby="listing-title" className="mx-auto max-w-7xl px-4 pt-4 pb-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 id="listing-title" className="section-title">
              {city ? `Hoteles en ${city}` : "Nuestros hoteles"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Seleccionados por calidad y experiencia del huésped
            </p>
          </div>
          <a
            href="/buscar"
            className="shrink-0 rounded-xl border border-brand-navy/10 px-4 py-2 text-sm font-medium text-brand-navy transition-colors hover:bg-brand-navy/5 dark:border-white/10 dark:text-white dark:hover:bg-white/5"
          >
            Ver todos →
          </a>
        </div>

        <Suspense fallback={<SkeletonGrid />}>
          <HotelGrid city={city} />
        </Suspense>
      </section>

      {/* ── 3. Sección de destacados al final de la página ── */}
      <section aria-labelledby="features-title" className="mx-auto max-w-7xl px-4 pb-16">
        <div className="mb-6 text-center">
          <h2 id="features-title" className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
            ¿Por qué reservar con nosotros?
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tranquilidad, flexibilidad y transparencia en cada estancia
          </p>
        </div>
        <FeaturesStrip />
      </section>
    </div>
  );
}
