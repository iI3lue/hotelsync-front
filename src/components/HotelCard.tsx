import Link from "next/link";
import { memo } from "react";
import type { Hotel, SearchState, StayAvailability } from "@/lib/api";
import { minRate, withSearch } from "@/lib/api";
import { hotelImage } from "@/lib/imagery";
import PriceFrom from "@/components/PriceFrom";
import Photo from "@/components/ui/Photo";
import Arrow from "@/components/ui/Arrow";
import { AmenityList } from "@/components/ui/Amenity";

/* ─── Availability badge ───────────────────────────────────── */
function AvailabilityBadge({ status }: { status: StayAvailability }) {
  if (status === "available") {
    return (
      <span className="badge-available">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Disponible en tus fechas
      </span>
    );
  }
  return (
    <span className="badge-pending">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
      A confirmar
    </span>
  );
}

/* ─── Main card ────────────────────────────────────────────── */
interface HotelCardProps {
  hotel: Hotel;
  search?: SearchState;
  availability?: StayAvailability;
  /** Proporción de la foto: vertical (colección) u horizontal (resultados). */
  ratio?: "portrait" | "landscape";
  /** Índice opcional para escalonar la entrada. */
  index?: number;
}

function HotelCard({ hotel, search, availability, ratio = "portrait", index = 0 }: HotelCardProps) {
  const roomTypes = hotel.roomTypes ?? [];
  const rate = minRate(hotel);
  const amenities = Array.from(new Set(roomTypes.flatMap((r) => r.amenities ?? [])));
  const maxGuests = roomTypes.reduce((m, r) => Math.max(m, r.capacity ?? 0), 0);
  const href = withSearch(`/hotels/${hotel.hotel_id}`, search);

  return (
    <article
      data-reveal=""
      style={{ ["--reveal-delay" as string]: `${(index % 3) * 90}ms` }}
      className="group relative flex flex-col"
    >
      <Link
        href={href}
        aria-label={`Ver ${hotel.name}`}
        className={`relative block w-full overflow-hidden bg-brand-stone dark:bg-brand-navy-800 ${ratio === "portrait" ? "aspect-[4/5]" : "aspect-[3/2]"}`}
      >
        <Photo
          src={hotelImage(hotel, 1200)}
          alt={hotel.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1200 ease-silk group-hover:scale-[1.04]"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        {availability && (
          <span className="absolute left-4 top-4">
            <AvailabilityBadge status={availability} />
          </span>
        )}
        <span className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white text-brand-navy opacity-0 transition-all duration-500 ease-silk group-hover:translate-y-0 group-hover:opacity-100">
          <Arrow className="h-2.5 w-4" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col pt-6">
        <p className="eyebrow">
          {hotel.city} <span className="mx-1.5 opacity-50">·</span> {hotel.country}
        </p>

        <h2 className="mt-3 font-display text-[1.75rem] leading-[1.12] text-brand-navy dark:text-white">
          <Link href={href} className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-700 ease-silk group-hover:bg-[length:100%_1px]">
            {hotel.name}
          </Link>
        </h2>

        <p className="mt-2 text-[0.875rem] text-brand-navy/55 dark:text-white/50">
          {roomTypes.length === 0
            ? "Habitaciones próximamente"
            : `${roomTypes.length} ${roomTypes.length === 1 ? "tipo de habitación" : "tipos de habitación"}`}
          {maxGuests > 0 && ` · hasta ${maxGuests} huéspedes`}
        </p>

        {amenities.length > 0 && <AmenityList amenities={amenities} max={3} className="mt-5" />}

        <div className="mt-auto pt-6">
        <div className="flex items-end justify-between gap-4 border-t border-brand-navy/10 pt-5 dark:border-white/10">
          {rate !== null ? (
            <div className="text-brand-navy dark:text-white">
              <PriceFrom rate={rate} />
            </div>
          ) : (
            <span className="text-sm text-brand-navy/45 dark:text-white/40">Tarifa a consultar</span>
          )}

          <Link
            href={withSearch(`/hotels/${hotel.hotel_id}/availability`, search)}
            aria-label={`Consultar fechas en ${hotel.name}`}
            className="link-line shrink-0 text-brand-navy dark:text-white"
          >
            Ver fechas
          </Link>
        </div>
        </div>
      </div>
    </article>
  );
}

export default memo(HotelCard);
