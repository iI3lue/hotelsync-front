"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DatePickerButton from "@/components/DatePickerButton";
import Popover from "@/components/Popover";
import { fetchHotels } from "@/lib/api-client";

interface DestinationOption {
  city: string;
  country: string;
  hotelName: string;
}

// Opciones por defecto alineadas con la base de datos para carga instantánea
const DEFAULT_DESTINATIONS: DestinationOption[] = [
  { city: "Buenos Aires", country: "Argentina", hotelName: "Hotel Sync Centro" },
  { city: "Mar del Plata", country: "Argentina", hotelName: "Hotel Sync Costa" },
  { city: "San Carlos de Bariloche", country: "Argentina", hotelName: "Hotel Sync Bariloche & Spa" },
  { city: "Mendoza", country: "Argentina", hotelName: "Hotel Sync Mendoza Wine & Golf" },
  { city: "Medellín", country: "Colombia", hotelName: "Hotel Sync Poblado Medellín" },
  { city: "Cartagena", country: "Colombia", hotelName: "Hotel Sync Cartagena Caribe" },
];

const MIN_GUESTS = 1;
const MAX_GUESTS = 8;

function nightsBetween(from: string, to: string): number {
  if (!from || !to) return 0;
  const a = Date.parse(`${from}T12:00:00`);
  const b = Date.parse(`${to}T12:00:00`);
  const n = Math.round((b - a) / 86_400_000);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

interface SearchBarProps {
  initialCity?: string;
  initialFrom?: string;
  initialTo?: string;
  initialGuests?: string;
  /** When true, renders floating glass style (on hero) */
  heroMode?: boolean;
}

export default function SearchBar({
  initialCity = "",
  initialFrom = "",
  initialTo = "",
  initialGuests = "2",
  heroMode = false,
}: SearchBarProps) {
  const router = useRouter();
  const [city, setCity] = useState(initialCity);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [guests, setGuests] = useState(initialGuests);

  // Estados de dropdowns
  const [isCityOpen, setIsCityOpen] = useState(false);
  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [destinations, setDestinations] = useState<DestinationOption[]>(DEFAULT_DESTINATIONS);

  const cityContainerRef = useRef<HTMLDivElement>(null);
  const guestsContainerRef = useRef<HTMLDivElement>(null);
  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);

  // Señales de apertura: clickear cualquier parte del campo abre su calendario.
  const [fromSignal, setFromSignal] = useState(0);
  const [toSignal, setToSignal] = useState(0);

  // Cargar destinos reales de la base de datos vía API cliente
  useEffect(() => {
    let active = true;
    fetchHotels()
      .then((hotels) => {
        if (!active || !Array.isArray(hotels) || hotels.length === 0) return;
        const mapped = hotels.map((h) => ({
          city: h.city,
          country: h.country,
          hotelName: h.name,
        }));
        // Deduplicar por ciudad si hubiera múltiples en la misma ciudad
        const uniqueCities: DestinationOption[] = [];
        const seen = new Set<string>();
        for (const item of mapped) {
          const key = item.city.toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueCities.push(item);
          }
        }
        setDestinations(uniqueCities);
      })
      .catch(() => {
        // En caso de fallo transitorio, mantiene DEFAULT_DESTINATIONS
      });

    return () => {
      active = false;
    };
  }, []);

  // El cierre por clic afuera/Escape/scroll lo maneja el Popover portal.
  // (Un listener propio acá cerraría el menú en `mousedown`, antes de que
  // el `click` en una opción del portal llegue a dispararse.)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCityOpen(false);
    setIsGuestsOpen(false);
    const params = new URLSearchParams();
    if (city.trim()) params.set("city", city.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (guests) params.set("guests", guests);
    const query = params.toString();
    router.push(query ? `/buscar?${query}` : "/buscar");
  };

  const filteredDestinations = destinations.filter(
    (d) =>
      !city.trim() ||
      d.city.toLowerCase().includes(city.toLowerCase().trim()) ||
      d.country.toLowerCase().includes(city.toLowerCase().trim()) ||
      d.hotelName.toLowerCase().includes(city.toLowerCase().trim())
  );

  const nights = nightsBetween(from, to);
  const guestsN = Math.min(MAX_GUESTS, Math.max(MIN_GUESTS, Number(guests) || 2));

  const containerClass = heroMode
    ? "relative z-30 bg-white text-brand-navy shadow-glass dark:bg-brand-navy-800 dark:text-white"
    : "relative z-30 border border-brand-navy/12 bg-white text-brand-navy dark:border-white/10 dark:bg-brand-navy-800 dark:text-white";

  const fieldClass =
    "group relative flex min-w-0 cursor-pointer flex-col justify-center gap-1.5 border-b border-brand-navy/10 px-5 py-4 transition-colors duration-300 hover:bg-brand-navy/[0.025] dark:border-white/10 dark:hover:bg-white/[0.03] md:border-b-0 md:border-r md:px-6 md:py-5";

  const labelCls = "text-eyebrow uppercase text-brand-navy/50 select-none dark:text-white/45";
  const valueCls = "w-full truncate bg-transparent text-[0.95rem] text-brand-navy outline-none placeholder:text-brand-navy/40 dark:text-white dark:placeholder:text-white/40";

  return (
    <form onSubmit={handleSubmit} role="search" aria-label="Buscar hoteles" className={containerClass}>
      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        {/* ── Destino ── */}
        <div
          ref={cityContainerRef}
          className={fieldClass}
          onClick={() => {
            setIsCityOpen(true);
            setIsGuestsOpen(false);
          }}
        >
          <label htmlFor="search-city" className={labelCls}>Destino</label>
          <input
            id="search-city"
            name="city"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Ciudad u hotel"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setIsCityOpen(true);
            }}
            onFocus={() => setIsCityOpen(true)}
            className={valueCls}
          />

          <Popover anchorRef={cityContainerRef} open={isCityOpen} onClose={() => setIsCityOpen(false)}>
            <div className="w-[22rem] max-w-[92vw] rounded-[2px] border border-brand-navy/10 bg-white py-3 text-brand-navy shadow-elevated dark:border-white/10 dark:bg-brand-navy-800 dark:text-white">
              <div className="flex items-center justify-between px-5 pb-2 pt-1">
                <span className="text-eyebrow uppercase text-brand-navy/45 dark:text-white/45">
                  {destinations.length} destinos
                </span>
                {city && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCity("");
                      setIsCityOpen(false);
                    }}
                    className="text-eyebrow uppercase text-brand-gold hover:underline"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {filteredDestinations.map((dest) => {
                  const selected = city.toLowerCase() === dest.city.toLowerCase();
                  return (
                    <button
                      key={`${dest.city}-${dest.hotelName}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCity(dest.city);
                        setIsCityOpen(false);
                      }}
                      className={`flex w-full items-baseline justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-brand-navy/[0.04] dark:hover:bg-white/5 ${selected ? "bg-brand-navy/[0.04] dark:bg-white/5" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="block font-display text-[1.2rem] leading-tight">{dest.city}</span>
                        <span className="block truncate text-xs text-brand-navy/50 dark:text-white/45">{dest.hotelName}</span>
                      </span>
                      <span className="shrink-0 text-eyebrow uppercase text-brand-navy/40 dark:text-white/40">{dest.country}</span>
                    </button>
                  );
                })}

                {filteredDestinations.length === 0 && (
                  <p className="px-5 py-6 text-sm text-brand-navy/50 dark:text-white/50">
                    No encontramos destinos para &quot;{city}&quot;.
                  </p>
                )}
              </div>
            </div>
          </Popover>
        </div>

        {/* ── Llegada ── */}
        <div
          ref={fromContainerRef}
          className={fieldClass}
          onClick={(e) => {
            // El botón interno ya alterna por sí solo; acá solo ampliamos
            // el hitbox al resto del contenedor.
            if ((e.target as HTMLElement).closest("button")) return;
            setFromSignal((n) => n + 1);
          }}
        >
          <span className={labelCls}>Llegada</span>
          <DatePickerButton
            label="Fecha de llegada"
            id="search-from"
            value={from}
            onChange={(iso) => {
              setFrom(iso);
              if (to && to <= iso) setTo("");
              // Tras elegir la llegada, se abre la salida: flujo continuo.
              if (!to || to <= iso) setToSignal((n) => n + 1);
            }}
            rangeTo={to || undefined}
            openSignal={fromSignal}
            compact
          />
        </div>

        {/* ── Salida ── */}
        <div
          ref={toContainerRef}
          className={fieldClass}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            setToSignal((n) => n + 1);
          }}
        >
          <span className={labelCls}>
            Salida
            {nights > 0 && (
              <span className="ml-2 normal-case tracking-normal text-brand-gold">
                · {nights} {nights === 1 ? "noche" : "noches"}
              </span>
            )}
          </span>
          <DatePickerButton
            label="Fecha de salida"
            id="search-to"
            value={to}
            minDate={from || undefined}
            onChange={setTo}
            rangeFrom={from || undefined}
            rangeTo={to || undefined}
            openSignal={toSignal}
            compact
          />
        </div>

        {/* ── Huéspedes ── */}
        <div
          ref={guestsContainerRef}
          className={fieldClass}
          onClick={() => {
            setIsGuestsOpen((prev) => !prev);
            setIsCityOpen(false);
          }}
        >
          <span className={labelCls}>Huéspedes</span>
          <button type="button" aria-haspopup="dialog" aria-expanded={isGuestsOpen} className={`${valueCls} text-left`}>
            {guestsN} {guestsN === 1 ? "huésped" : "huéspedes"}
          </button>

          <Popover anchorRef={guestsContainerRef} open={isGuestsOpen} onClose={() => setIsGuestsOpen(false)} align="right">
            <div
              role="dialog"
              aria-label="Cantidad de huéspedes"
              onClick={(e) => e.stopPropagation()}
              className="w-72 rounded-[2px] border border-brand-navy/10 bg-white p-5 text-brand-navy shadow-elevated dark:border-white/10 dark:bg-brand-navy-800 dark:text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.95rem]">Huéspedes</p>
                  <p className="text-xs text-brand-navy/50 dark:text-white/45">Adultos y niños</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Quitar un huésped"
                    disabled={guestsN <= MIN_GUESTS}
                    onClick={() => setGuests(String(guestsN - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-navy/20 transition-colors hover:border-brand-navy disabled:opacity-30 dark:border-white/25 dark:hover:border-white"
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true"><path d="M1 6h10" stroke="currentColor" strokeWidth="1.2" /></svg>
                  </button>
                  <span className="w-4 text-center tabular-nums" aria-live="polite">{guestsN}</span>
                  <button
                    type="button"
                    aria-label="Agregar un huésped"
                    disabled={guestsN >= MAX_GUESTS}
                    onClick={() => setGuests(String(guestsN + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-navy/20 transition-colors hover:border-brand-navy disabled:opacity-30 dark:border-white/25 dark:hover:border-white"
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true"><path d="M1 6h10M6 1v10" stroke="currentColor" strokeWidth="1.2" /></svg>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestsOpen(false)}
                className="btn-primary mt-5 w-full py-3"
              >
                Listo
              </button>
            </div>
          </Popover>
        </div>

        {/* ── Buscar ── */}
        <div className="flex p-3 md:p-2.5">
          <button type="submit" className="btn-primary h-full min-h-[52px] w-full md:min-w-[11rem]">
            Ver disponibilidad
          </button>
        </div>
      </div>
    </form>
  );
}
