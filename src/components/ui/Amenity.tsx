import type { ReactNode } from "react";

/**
 * Comodidades: etiqueta en español + ícono de línea fina.
 * Reemplaza los emojis anteriores por un set coherente con la marca.
 */
const LABELS: Record<string, string> = {
  wifi: "Wi-Fi",
  pool: "Piscina",
  piscina: "Piscina",
  spa: "Spa",
  gym: "Gimnasio",
  breakfast: "Desayuno",
  desayuno: "Desayuno",
  ac: "Aire acondicionado",
  air_conditioning: "Aire acondicionado",
  tv: "Televisión",
  parking: "Estacionamiento",
  ocean_view: "Vista al mar",
  "vista al mar": "Vista al mar",
  beach_view: "Vista a la playa",
  balcony: "Balcón",
  minibar: "Minibar",
  room_service: "Room service",
  restaurant: "Restaurante",
  bar: "Bar",
  pet_friendly: "Admite mascotas",
};

export function amenityLabel(a: string): string {
  const k = a.toLowerCase().trim();
  if (LABELS[k]) return LABELS[k];
  const s = k.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const P = (d: string) => <path d={d} />;

const ICONS: Record<string, ReactNode> = {
  wifi: <>{P("M2.5 9a14 14 0 0119 0")}{P("M5.5 12.5a9.5 9.5 0 0113 0")}{P("M8.6 16a5 5 0 016.8 0")}<circle cx="12" cy="19" r="0.9" fill="currentColor" /></>,
  pool: <>{P("M2 17c2 0 2-1.2 4-1.2s2 1.2 4 1.2 2-1.2 4-1.2 2 1.2 4 1.2 2-1.2 4-1.2")}{P("M2 20.5c2 0 2-1.2 4-1.2s2 1.2 4 1.2 2-1.2 4-1.2 2 1.2 4 1.2 2-1.2 4-1.2")}{P("M8 15V5.5a2 2 0 014 0")}{P("M15 15V5.5a2 2 0 014 0")}{P("M8 9h7M8 12.5h7")}</>,
  spa: <>{P("M12 20c-4.5 0-8-3-8-7.5 2.8 0 5.6 1.4 8 4 2.4-2.6 5.2-4 8-4 0 4.5-3.5 7.5-8 7.5z")}{P("M12 16.5c-1.6-2.4-1.6-6.6 0-10.5 1.6 3.9 1.6 8.1 0 10.5z")}</>,
  gym: <>{P("M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11")}</>,
  breakfast: <>{P("M4 10h12v3.5a5 5 0 01-5 5H9a5 5 0 01-5-5V10z")}{P("M16 11h1.5a2.25 2.25 0 010 4.5H16")}{P("M8 4.5c0 1.5 1 1.5 1 3M11.5 4.5c0 1.5 1 1.5 1 3")}{P("M3 21h14")}</>,
  ac: <>{P("M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9")}{P("M9.8 4.6L12 6.4l2.2-1.8M9.8 19.4L12 17.6l2.2 1.8")}</>,
  tv: <>{P("M3.5 6h17v11h-17z")}{P("M8.5 20.5h7M12 17v3.5")}</>,
  parking: <>{P("M4 4h16v16H4z")}{P("M9.5 16.5v-9h3.25a2.75 2.75 0 010 5.5H9.5")}</>,
  ocean_view: <>{P("M2 14.5c2.5 0 2.5-1.5 5-1.5s2.5 1.5 5 1.5 2.5-1.5 5-1.5 2.5 1.5 5 1.5")}{P("M2 18.5c2.5 0 2.5-1.5 5-1.5s2.5 1.5 5 1.5 2.5-1.5 5-1.5 2.5 1.5 5 1.5")}{P("M7.5 10a4.5 4.5 0 019 0")}</>,
  balcony: <>{P("M5 11V4h14v7")}{P("M12 4v7")}{P("M3 11h18M4.5 11v9M9 11v9M15 11v9M19.5 11v9M3 20h18")}</>,
  minibar: <>{P("M8 3h8l-1 8a3 3 0 01-6 0L8 3z")}{P("M12 14v6M9 20.5h6")}{P("M8.6 7h6.8")}</>,
  room_service: <>{P("M3 18h18")}{P("M4.5 18a7.5 7.5 0 0115 0")}{P("M12 10.5V8.5M10.5 8.5h3")}</>,
  restaurant: <>{P("M7 3v8a2 2 0 002 0V3M7 3v18M9 3v8")}{P("M5 3v6a2 2 0 002 2")}{P("M17 21V3c-2 1.5-3 4-3 7v3h3")}</>,
  bar: <>{P("M4.5 4.5h15L12 13 4.5 4.5z")}{P("M12 13v7M8.5 20.5h7")}{P("M15.5 4.5l2.5-2")}</>,
  pet_friendly: <><circle cx="7" cy="9" r="1.6" /><circle cx="17" cy="9" r="1.6" /><circle cx="10" cy="5.5" r="1.6" /><circle cx="14" cy="5.5" r="1.6" />{P("M12 12c-3 0-5.5 3.5-5.5 5.5 0 1.5 1.3 2.2 2.8 1.8 1-.3 1.8-.6 2.7-.6s1.7.3 2.7.6c1.5.4 2.8-.3 2.8-1.8 0-2-2.5-5.5-5.5-5.5z")}</>,
};
ICONS.air_conditioning = ICONS.ac;
ICONS.beach_view = ICONS.ocean_view;
ICONS["vista al mar"] = ICONS.ocean_view;
ICONS.piscina = ICONS.pool;
ICONS.desayuno = ICONS.breakfast;

export function AmenityIcon({ amenity, className = "h-[18px] w-[18px]" }: { amenity: string; className?: string }) {
  const icon = ICONS[amenity.toLowerCase().trim()];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {icon ?? <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />}
    </svg>
  );
}

/** Lista horizontal "ícono + texto" separada por filetes finos. */
export function AmenityList({ amenities, max, className = "" }: { amenities: string[]; max?: number; className?: string }) {
  const list = typeof max === "number" ? amenities.slice(0, max) : amenities;
  const rest = typeof max === "number" ? Math.max(0, amenities.length - max) : 0;
  return (
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[0.8125rem] text-brand-navy/70 dark:text-white/65 ${className}`} aria-label="Comodidades">
      {list.map((a) => (
        <li key={a} className="inline-flex items-center gap-2">
          <AmenityIcon amenity={a} className="h-[17px] w-[17px] text-brand-gold" />
          <span>{amenityLabel(a)}</span>
        </li>
      ))}
      {rest > 0 && <li className="text-brand-navy/45 dark:text-white/40">+{rest} más</li>}
    </ul>
  );
}
