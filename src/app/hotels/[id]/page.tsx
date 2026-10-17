import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchHotelById,
  fetchRoomTypes,
  withSearch,
  type SearchState,
} from "@/lib/api";
import { hotelImage, roomImage } from "@/lib/imagery";
import { cityLine } from "@/lib/destinations";
import Breadcrumbs from "@/components/Breadcrumbs";
import Money from "@/components/Money";
import RoomTypeCard from "@/components/RoomTypeCard";
import EmptyState from "@/components/EmptyState";
import ParallaxImage from "@/components/ui/ParallaxImage";
import Photo from "@/components/ui/Photo";
import LocalTime from "@/components/ui/LocalTime";
import Arrow from "@/components/ui/Arrow";
import { AmenityIcon, amenityLabel } from "@/components/ui/Amenity";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const hotel = await fetchHotelById(id).catch(() => null);
  if (!hotel) return { title: "Hotel" };
  return {
    title: `${hotel.name}, ${hotel.city}`,
    description: `${hotel.name} en ${hotel.city}, ${hotel.country}. ${cityLine(hotel.city)}`,
  };
}

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchState>;
}) {
  const { id } = await params;
  const state = await searchParams;
  const search: SearchState = {
    city: state.city,
    from: state.from,
    to: state.to,
    guests: state.guests,
    amenity: state.amenity,
    minCap: state.minCap,
    sort: state.sort,
    room_type_id: state.room_type_id,
    date: state.date,
  };

  // Paralelo: hotel + habitaciones (async-parallel).
  const [hotel, roomTypes] = await Promise.all([
    fetchHotelById(id).catch(() => null),
    fetchRoomTypes(id).catch(() => []),
  ]);

  if (!hotel) {
    return (
      <div className="shell py-16">
        <EmptyState
          title="No encontramos este hotel"
          description="Puede que el enlace haya cambiado o que el servicio no responda. Volvé al listado y probá de nuevo."
          actionHref={withSearch("/", search)}
          actionLabel="Volver al inicio"
        />
      </div>
    );
  }

  const rates = roomTypes.map((r) => Number(r.base_rate));
  const from = rates.length > 0 ? Math.min(...rates) : null;
  const maxGuests = roomTypes.reduce((m, r) => Math.max(m, r.capacity), 0);
  const amenities = Array.from(new Set(roomTypes.flatMap((r) => r.amenities ?? [])));
  const availabilityHref = withSearch(`/hotels/${id}/availability`, search);
  const bookHref = withSearch("/reservas/nueva", search, { room_type_id: undefined, date: undefined, hotel: id });

  const gallery = [
    { src: hotelImage(hotel, 2000), alt: hotel.name },
    ...roomTypes.slice(0, 4).map((r) => ({ src: roomImage(r, 1200), alt: r.name })),
  ];

  const sections = [
    { id: "resumen", label: "El hotel" },
    ...(roomTypes.length > 0 ? [{ id: "habitaciones", label: "Habitaciones" }] : []),
    ...(hotel.cancellationPolicies?.length ? [{ id: "politicas", label: "Políticas" }] : []),
  ];

  return (
    <div className="pb-16 md:pb-0">
      {/* ── Hero ── */}
      <section className="relative isolate flex h-[86svh] min-h-[560px] items-end overflow-hidden bg-brand-navy-950 text-white">
        <ParallaxImage src={hotelImage(hotel, 2400)} alt={hotel.name} priority strength={140} />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35" />

        <div className="shell relative z-10 pb-14 md:pb-20">
          <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <Breadcrumbs tone="inverse" items={[{ label: "Hoteles", href: withSearch("/buscar", search) }, { label: hotel.city }]} />
          </div>
          <h1 className="mt-8 max-w-5xl font-display text-display-lg">
            <span className="mask-line"><span style={{ ["--d" as string]: "250ms" }}>{hotel.name}</span></span>
          </h1>

          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/20 pt-6 md:mt-10 lg:grid-cols-4">
            <div className="animate-slide-up" style={{ animationDelay: "600ms" }}>
              <p className="text-eyebrow uppercase text-white/55">Ubicación</p>
              <p className="mt-2 text-[0.95rem]">{hotel.address ? hotel.address : `${hotel.city}, ${hotel.country}`}</p>
              {hotel.address && <p className="text-[0.85rem] text-white/60">{hotel.city}, {hotel.country}</p>}
            </div>
            <div className="animate-slide-up" style={{ animationDelay: "680ms" }}>
              <p className="text-eyebrow uppercase text-white/55">Hora local</p>
              <p className="mt-2 text-[0.95rem]">
                <LocalTime timeZone={hotel.timezone} /> <span className="text-white/60">en {hotel.city}</span>
              </p>
            </div>
            {roomTypes.length > 0 && (
              <div className="hidden animate-slide-up lg:block" style={{ animationDelay: "760ms" }}>
                <p className="text-eyebrow uppercase text-white/55">Habitaciones</p>
                <p className="mt-2 text-[0.95rem]">
                  {roomTypes.length} {roomTypes.length === 1 ? "tipo" : "tipos"} · hasta {maxGuests} huéspedes
                </p>
              </div>
            )}
            {from !== null && (
              <div className="col-span-2 animate-slide-up lg:col-span-1 lg:text-right" style={{ animationDelay: "840ms" }}>
                <p className="text-eyebrow uppercase text-white/55">Tarifa desde</p>
                <p className="mt-1 font-display text-[2rem] leading-none tabular-nums">
                  <Money amountCOP={from} /> <span className="font-sans text-[0.85rem] text-white/60">/ noche</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Sub-navegación fija ── */}
      <div className="sticky top-0 z-40 border-b border-brand-navy/10 bg-brand-paper/95 backdrop-blur-md dark:border-white/10 dark:bg-brand-navy-900/95">
        <div className="shell flex h-16 items-center justify-between gap-6">
          <nav aria-label="Secciones del hotel" className="no-scrollbar -mx-3 flex min-w-0 overflow-x-auto">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="nav-link shrink-0 px-3 py-2 text-brand-navy dark:text-white">
                {s.label}
              </a>
            ))}
          </nav>
          <div className="hidden shrink-0 items-center gap-6 md:flex">
            <Link href={availabilityHref} className="link-line text-brand-navy dark:text-white">
              Ver fechas libres
            </Link>
            <Link href={bookHref} className="btn-primary py-3">
              Reservar
            </Link>
          </div>
        </div>
      </div>

      {/* ── Resumen ── */}
      <section id="resumen" aria-labelledby="resumen-title" className="shell scroll-mt-20 pt-24 md:pt-32">
        <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
          <p className="eyebrow" data-reveal="fade">El hotel</p>
          <div>
            <h2 id="resumen-title" data-reveal="" className="max-w-4xl font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.2] text-brand-navy dark:text-white">
              {cityLine(hotel.city)} {hotel.name} es tu casa en {hotel.city}.
            </h2>

            {amenities.length > 0 && (
              <div className="mt-16" data-reveal="">
                <h3 className="eyebrow">Comodidades</h3>
                <ul className="mt-6 grid grid-cols-2 gap-x-8 sm:grid-cols-3 lg:grid-cols-4">
                  {amenities.map((a) => (
                    <li key={a} className="flex items-center gap-3 border-t border-brand-navy/10 py-4 text-[0.925rem] text-brand-navy/80 dark:border-white/10 dark:text-white/75">
                      <AmenityIcon amenity={a} className="h-5 w-5 shrink-0 text-brand-gold" />
                      {amenityLabel(a)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Galería ── */}
      {gallery.length > 1 && (() => {
        const shown = gallery.length >= 5 ? 5 : gallery.length >= 3 ? 3 : 2;
        const cols = shown === 5 ? "md:grid-cols-4" : shown === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
        return (
          <section aria-label="Galería" className="shell pt-24 md:pt-32">
            <div className={`grid grid-cols-2 gap-3 md:grid-rows-2 md:gap-4 ${cols}`}>
              {gallery.slice(0, shown).map((g, i) => {
                const big = i === 0 && shown >= 3;
                const span = big
                  ? "col-span-2 row-span-2 aspect-[4/3] md:aspect-auto"
                  : shown === 2
                    ? "col-span-2 aspect-[4/3] md:col-span-1 md:row-span-2"
                    : "aspect-square";
                return (
                  <figure
                    key={g.src + i}
                    data-reveal="image"
                    style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}
                    className={`relative overflow-hidden bg-brand-stone dark:bg-brand-navy-800 ${span}`}
                  >
                    <Photo src={g.src} alt={g.alt} className="absolute inset-0 h-full w-full object-cover" />
                    {i > 0 && (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10 text-[0.8rem] text-white">
                        {g.alt}
                      </figcaption>
                    )}
                  </figure>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* ── Habitaciones ── */}
      <section id="habitaciones" aria-labelledby="rooms-title" className="shell scroll-mt-20 pt-28 md:pt-40">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6 md:mb-24">
          <div>
            <p className="eyebrow" data-reveal="fade">Habitaciones y suites</p>
            <h2 id="rooms-title" data-reveal="" className="mt-4 font-display text-display-md text-brand-navy dark:text-white">
              Elegí dónde dormir
            </h2>
          </div>
          <p data-reveal="fade" className="max-w-sm text-[0.95rem] text-brand-navy/60 dark:text-white/55">
            {roomTypes.length} {roomTypes.length === 1 ? "opción" : "opciones"}. Mirá las fechas libres de cada una o reservá directo.
          </p>
        </div>

        {roomTypes.length === 0 ? (
          <EmptyState
            title="Habitaciones próximamente"
            description="Este hotel todavía no publicó sus habitaciones. Mientras tanto, podés consultar otros destinos."
            actionHref="/buscar"
            actionLabel="Ver otros hoteles"
          />
        ) : (
          <div className="space-y-24 md:space-y-36">
            {roomTypes.map((roomType, i) => (
              <RoomTypeCard key={roomType.room_type_id} roomType={roomType} search={search} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── Políticas ── */}
      {hotel.cancellationPolicies && hotel.cancellationPolicies.length > 0 && (
        <section id="politicas" aria-labelledby="cancel-title" className="shell scroll-mt-20 pt-28 md:pt-40">
          <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
            <div>
              <p className="eyebrow" data-reveal="fade">Antes de reservar</p>
            </div>
            <div>
              <h2 id="cancel-title" data-reveal="" className="font-display text-display-sm text-brand-navy dark:text-white">
                Políticas de cancelación
              </h2>
              <p data-reveal="fade" className="mt-3 max-w-lg text-[0.95rem] text-brand-navy/60 dark:text-white/55">
                Las condiciones se muestran antes de confirmar, para que reserves sabiendo exactamente qué esperar.
              </p>
              <dl className="mt-12 grid gap-x-12 sm:grid-cols-2">
                {hotel.cancellationPolicies.map((policy, i) => (
                  <div key={policy.policy_id} data-reveal="" style={{ ["--reveal-delay" as string]: `${i * 80}ms` }} className="border-t border-brand-navy/15 py-7 dark:border-white/15">
                    <dt className="font-display text-[1.4rem] text-brand-navy dark:text-white">{policy.name}</dt>
                    <dd className="mt-2 text-[0.925rem] leading-relaxed text-brand-navy/65 dark:text-white/60">{policy.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* ── Cierre ── */}
      <section className="shell pt-28 md:pt-40">
        <div className="flex flex-col items-start justify-between gap-10 border-t border-brand-navy/15 pt-14 dark:border-white/15 md:flex-row md:items-end">
          <h2 data-reveal="" className="max-w-2xl font-display text-display-md text-brand-navy dark:text-white">
            ¿Te vemos en {hotel.city}?
          </h2>
          <div data-reveal="fade" className="flex flex-wrap items-center gap-6">
            <Link href={availabilityHref} className="link-line text-brand-navy dark:text-white">
              Consultar disponibilidad
            </Link>
            <Link href={bookHref} className="btn-primary">
              Reservar ahora <Arrow className="h-2.5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Barra de reserva móvil ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-navy/10 bg-brand-paper/95 px-5 py-3 backdrop-blur-md dark:border-white/10 dark:bg-brand-navy-900/95 md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center justify-between gap-4">
          {from !== null ? (
            <p className="leading-tight text-brand-navy dark:text-white">
              <span className="block text-eyebrow uppercase text-brand-navy/50 dark:text-white/50">Desde</span>
              <span className="tabular-nums"><Money amountCOP={from} /></span>
              <span className="ml-1 text-xs text-brand-navy/50 dark:text-white/50">/ noche</span>
            </p>
          ) : (
            <span className="font-display text-lg text-brand-navy dark:text-white">{hotel.city}</span>
          )}
          <Link href={bookHref} className="btn-primary px-6 py-3">
            Reservar
          </Link>
        </div>
      </div>
    </div>
  );
}
