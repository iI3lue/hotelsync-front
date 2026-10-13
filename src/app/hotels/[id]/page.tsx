import {
  fetchHotelById,
  fetchRoomTypes,
  withSearch,
  type SearchState,
} from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import PriceFrom from "@/components/PriceFrom";
import RoomTypeCard from "@/components/RoomTypeCard";
import EmptyState from "@/components/EmptyState";

/* ─── Deterministic gradient selection ───────────────────────── */
const HERO_GRADIENTS = [
  "from-slate-900 via-indigo-950 to-blue-900",
  "from-brand-navy-950 via-brand-navy to-slate-900",
  "from-blue-950 via-slate-900 to-indigo-900",
  "from-emerald-950 via-teal-950 to-slate-950",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return HERO_GRADIENTS[Math.abs(hash) % HERO_GRADIENTS.length];
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
      <EmptyState
        title="No encontramos este hotel"
        description="El hotel no existe o el servicio no responde. Volvé al listado e intentá de nuevo."
        actionHref={withSearch("/", search)}
        actionLabel="Volver al inicio"
      />
    );
  }

  const rates = roomTypes.map((r) => Number(r.base_rate));
  const from = rates.length > 0 ? Math.min(...rates) : null;
  const gradient = getGradient(hotel.name);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8">
      <Breadcrumbs items={[{ label: hotel.name }]} />

      {/* Hero Hotel Banner */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 text-white shadow-xl md:p-12`}>
        {hotel.image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hotel.image_url}
              alt={hotel.name}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : null}
        {/* Subtle decorative glow circles */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-semibold text-brand-gold backdrop-blur-sm border border-brand-gold/30">
                ★ 4.8 · Selección Exclusiva
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-sm border border-white/10">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {hotel.timezone}
              </span>
            </div>

            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white md:text-5xl">
              {hotel.name}
            </h1>

            {/* Dirección y ubicación desde la base de datos */}
            <div className="space-y-1 pt-1">
              {hotel.address && (
                <p className="flex items-center gap-2 text-sm font-medium text-amber-200/90 md:text-base">
                  <svg className="h-4 w-4 text-brand-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span>{hotel.address}</span>
                </p>
              )}
              <p className={`flex items-center gap-2 text-xs text-slate-300 md:text-sm ${hotel.address ? "pl-6" : ""}`}>
                {!hotel.address && (
                  <svg className="h-4 w-4 text-brand-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                )}
                <span>{hotel.city}, {hotel.country}</span>
              </p>
            </div>
          </div>

          {from !== null && (
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md dark:border-white/10">
              <span className="block text-xs font-medium uppercase tracking-wider text-slate-300">Tarifa desde</span>
              <div className="text-3xl font-extrabold text-white tabular-nums">
                <PriceFrom rate={from} size="lg" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action CTA Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={withSearch(`/hotels/${id}/availability`, search)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-6 py-3 text-sm font-bold text-brand-navy shadow-gold transition-all duration-200 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>Consultar disponibilidad general</span>
        </a>

        <a
          href={withSearch("/reservas/nueva", search, { room_type_id: undefined, date: undefined, hotel: id })}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-navy/15 bg-white px-6 py-3 text-sm font-semibold text-brand-navy shadow-sm transition-all duration-200 hover:border-brand-gold hover:bg-slate-50 dark:border-white/15 dark:bg-brand-navy-800 dark:text-white dark:hover:border-brand-gold"
        >
          <span>Reservar ahora</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>

      {/* Cancellation Policies con diseño limpio, contraste y colores acordes */}
      {hotel.cancellationPolicies && hotel.cancellationPolicies.length > 0 && (
        <section
          aria-labelledby="cancel-title"
          className="rounded-2.5xl border border-brand-navy/8 bg-white p-6 shadow-card dark:border-white/8 dark:bg-brand-navy-800"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.48-5.719A48.474 48.474 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018a16.5 16.5 0 008.25 14.28 16.5 16.5 0 008.25-14.28V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-.702 0-1.398.015-2.09.044z" />
              </svg>
            </div>
            <div>
              <h2 id="cancel-title" className="font-heading text-lg font-bold text-brand-navy dark:text-white">
                Políticas de cancelación
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Condiciones claras y garantizadas antes de efectuar tu pago
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {hotel.cancellationPolicies.map((policy) => (
              <div
                key={policy.policy_id}
                className="rounded-xl border border-brand-gold/20 bg-gradient-to-br from-brand-gold/5 via-amber-500/5 to-transparent p-4 dark:border-brand-gold/30 dark:bg-brand-navy-700/60"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <p className="font-semibold text-sm text-brand-navy dark:text-white">
                    {policy.name}
                  </p>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {policy.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Room Types Grid */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-extrabold text-brand-navy dark:text-white md:text-3xl">
              Habitaciones Disponibles
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Elegí tu habitación para consultar sus fechas libres o reservar directamente.
            </p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {roomTypes.length} {roomTypes.length === 1 ? "opción" : "opciones"}
          </span>
        </div>

        {roomTypes.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            No hay tipos de habitación disponibles en este momento.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roomTypes.map((roomType) => (
              <RoomTypeCard key={roomType.room_type_id} roomType={roomType} search={search} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
