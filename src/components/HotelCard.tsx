import Link from "next/link";
import { memo } from "react";
import type { Hotel, SearchState, StayAvailability } from "@/lib/api";
import { minRate, withSearch } from "@/lib/api";
import PriceFrom from "@/components/PriceFrom";

/* ─── Helpers ──────────────────────────────────────────────── */
function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

/** Deterministic pseudo-rating (4.0 – 4.9) from hotel_id hash */
function pseudoRating(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 4.0 + (h % 10) * 0.1;
}

/** Deterministic gradient from hotel name */
const GRADIENTS = [
  "from-[#1a3358] to-[#0f1e36]",
  "from-[#1f3a5f] to-[#162035]",
  "from-[#2c1a4a] to-[#1a0f2e]",
  "from-[#1a3333] to-[#0f2020]",
  "from-[#3a1a1a] to-[#200f0f]",
  "from-[#2a2a1a] to-[#1a1a0f]",
];
function gradientFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

/* ─── Stars ────────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <div className="flex items-center gap-0.5" aria-label={`Valoración: ${rating.toFixed(1)} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full;
        const half   = !filled && i === full && partial >= 0.5;
        return (
          <svg
            key={i}
            className={`h-3.5 w-3.5 ${filled || half ? "text-brand-gold" : "text-gray-300"}`}
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        );
      })}
      <span className="ml-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── Availability badge ───────────────────────────────────── */
function AvailabilityBadge({ status }: { status: StayAvailability }) {
  if (status === "available") {
    return (
      <span className="badge-available">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Disponible
      </span>
    );
  }
  return (
    <span className="badge-pending">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      A confirmar
    </span>
  );
}

/* ─── Amenity icon map ─────────────────────────────────────── */
const AMENITY_ICONS: Record<string, string> = {
  wifi:        "📶",
  parking:     "🅿️",
  pool:        "🏊",
  gym:         "🏋️",
  spa:         "💆",
  breakfast:   "🍳",
  restaurant:  "🍽️",
  bar:         "🍸",
  pet_friendly:"🐾",
  air_conditioning:"❄️",
  ocean_view:  "🌊",
  beach_view:  "🏖️",
  balcony:     "🌅",
};

function AmenityPill({ amenity }: { amenity: string }) {
  const icon = AMENITY_ICONS[amenity.toLowerCase()] ?? "✨";
  const label = amenity.replace(/_/g, " ");
  return (
    <li className="flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs capitalize text-gray-600 dark:border-white/8 dark:bg-white/5 dark:text-gray-400">
      <span aria-hidden="true">{icon}</span>
      {label}
    </li>
  );
}

/* ─── Main card ────────────────────────────────────────────── */
interface HotelCardProps {
  hotel: Hotel;
  search?: SearchState;
  availability?: StayAvailability;
}

function HotelCard({ hotel, search, availability }: HotelCardProps) {
  const roomTypes  = hotel.roomTypes ?? [];
  const rate       = minRate(hotel);
  const amenities  = Array.from(new Set(roomTypes.flatMap((r) => r.amenities ?? []))).slice(0, 4);
  const rating     = pseudoRating(hotel.hotel_id);
  const gradient   = gradientFor(hotel.name);

  return (
    <article
      style={{ contentVisibility: "auto", containIntrinsicSize: "0 380px" }}
      className="group flex flex-col overflow-hidden rounded-2.5xl bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 dark:bg-brand-navy-800 border border-brand-navy/8 dark:border-white/8"
    >
      {/* ── Image / placeholder ── */}
      <div className={`relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br ${gradient}`}>
        {hotel.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hotel.image_url}
            alt={hotel.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Initials watermark */
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center font-display text-6xl font-bold text-white/10 select-none"
          >
            {initials(hotel.name)}
          </div>
        )}

        {/* Gold shimmer line at top */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-60" />

        {/* Gradient overlay for text readability */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
        />

        {/* Availability badge */}
        {availability && (
          <div className="absolute bottom-3 left-3">
            <AvailabilityBadge status={availability} />
          </div>
        )}

        {/* Rating badge */}
        <div className="absolute right-3 top-3 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 backdrop-blur-sm">
          <Stars rating={rating} />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex min-w-0 flex-1 flex-col p-5">
        {/* Location & Address */}
        <div className="mb-1.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-gold">
            <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>{hotel.city}, {hotel.country}</span>
          </p>
          {hotel.address && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 pl-5 truncate">
              {hotel.address}
            </p>
          )}
        </div>

        {/* Name */}
        <h2 className="mb-2 text-lg font-semibold leading-snug tracking-tight text-brand-navy dark:text-white">
          {hotel.name}
        </h2>

        {/* Room count */}
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {roomTypes.length === 0
            ? "Sin tipos de habitación cargados"
            : roomTypes.length === 1
              ? "1 tipo de habitación"
              : `${roomTypes.length} tipos de habitación`}
        </p>

        {/* Amenities */}
        {amenities.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-1.5" aria-label="Servicios">
            {amenities.map((a) => (
              <AmenityPill key={a} amenity={a} />
            ))}
          </ul>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/6">
          <div>
            {rate !== null ? (
              <PriceFrom rate={rate} />
            ) : (
              <span className="text-xs text-gray-400">Consultar precio</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={withSearch(`/hotels/${hotel.hotel_id}/availability`, search)}
              aria-label={`Consultar disponibilidad en ${hotel.name}`}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-brand-navy/70 transition-colors hover:text-brand-navy dark:text-gray-400 dark:hover:text-white"
            >
              Ver fechas
            </Link>
            <Link
              href={withSearch(`/hotels/${hotel.hotel_id}`, search)}
              aria-label={`Ver detalles de ${hotel.name}`}
              className="btn-primary rounded-xl px-4 py-2 text-xs"
            >
              Ver hotel
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(HotelCard);
