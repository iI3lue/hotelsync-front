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

const GUEST_OPTIONS = [
  { value: "1", label: "1 huésped", desc: "Viajero solo" },
  { value: "2", label: "2 huéspedes", desc: "Pareja o 2 camas" },
  { value: "3", label: "3 huéspedes", desc: "Triple o familia pequeña" },
  { value: "4", label: "4 huéspedes", desc: "Suite familiar" },
  { value: "5", label: "5+ huéspedes", desc: "Grupos o familias numerosas" },
];

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

  const containerClass = heroMode
    ? "relative z-50 rounded-2xl border border-white/12 bg-white/10 p-2 backdrop-blur-xl shadow-glass md:p-2"
    : "relative z-50 rounded-2xl border border-brand-navy/8 bg-white p-2 shadow-card dark:border-white/8 dark:bg-brand-navy-800 md:p-2";

  const fieldContainerClass = heroMode
    ? "group flex flex-1 min-w-0 flex-col gap-0.5 rounded-xl px-4 py-2.5 transition-colors hover:bg-white/10 cursor-pointer"
    : "group flex flex-1 min-w-0 flex-col gap-0.5 rounded-xl px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer";

  const labelCls = heroMode
    ? "text-[10px] font-semibold uppercase tracking-widest text-blue-200/70 select-none"
    : "text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 select-none";

  const inputCls = heroMode
    ? "w-full bg-transparent text-sm font-medium text-white placeholder-blue-100/40 outline-none cursor-pointer"
    : "w-full bg-transparent text-sm font-medium text-brand-navy placeholder-gray-400 outline-none dark:text-white dark:placeholder-gray-500 cursor-pointer";

  const dividerCls = heroMode
    ? "w-px self-stretch bg-white/12"
    : "w-px self-stretch bg-gray-200 dark:bg-white/10";

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Buscar hoteles"
      className={containerClass}
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-stretch">
        {/* ── 1. Destino Seleccionable ── */}
        <div
          ref={cityContainerRef}
          className={`relative ${fieldContainerClass}`}
          onClick={() => {
            setIsCityOpen(true);
            setIsGuestsOpen(false);
          }}
        >
          <div className="flex items-center justify-between">
            <span className={labelCls}>Destino</span>
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${
                heroMode ? "text-blue-200/50" : "text-gray-400"
              } ${isCityOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <svg
              className={`h-4 w-4 shrink-0 ${heroMode ? "text-blue-200/60" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <input
              id="search-city"
              name="city"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Elegí un destino…"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setIsCityOpen(true);
              }}
              onFocus={() => setIsCityOpen(true)}
              className={inputCls}
            />
          </div>

          {/* Menú desplegable de destinos (portal: por encima de todo) */}
          <Popover
            anchorRef={cityContainerRef}
            open={isCityOpen}
            onClose={() => setIsCityOpen(false)}
          >
            <div className="w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-brand-navy-700 dark:bg-brand-navy-800">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Destinos disponibles ({destinations.length})
              </div>

              {city && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCity("");
                    setIsCityOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-brand-gold hover:bg-brand-gold/10 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Ver todos los destinos (limpiar filtro)</span>
                </button>
              )}

              <div className="max-h-64 overflow-y-auto space-y-1 mt-1 pr-1">
                {filteredDestinations.map((dest) => (
                  <button
                    key={`${dest.city}-${dest.hotelName}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCity(dest.city);
                      setIsCityOpen(false);
                    }}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      city.toLowerCase() === dest.city.toLowerCase()
                        ? "bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-bold"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-brand-navy-700"
                    }`}
                  >
                    <span className="mt-0.5 text-sm">📍</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm leading-tight text-brand-navy dark:text-white">
                        {dest.city}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {dest.hotelName} · {dest.country}
                      </div>
                    </div>
                  </button>
                ))}

                {filteredDestinations.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-slate-400">
                    No encontramos destinos para &quot;{city}&quot;.
                  </div>
                )}
              </div>
            </div>
          </Popover>
        </div>

        <div className={dividerCls} aria-hidden="true" />

        {/* ── 2. Llegada (DatePicker) ── */}
        <div
          ref={fromContainerRef}
          className={fieldContainerClass}
          onClick={(e) => {
            // El botón interno ya alterna por sí solo; acá solo ampliamos
            // el hitbox al resto del contenedor.
            if ((e.target as HTMLElement).closest("button")) return;
            setFromSignal((n) => n + 1);
          }}
        >
          <span className={labelCls}>Llegada</span>
          <div className="flex items-center gap-2">
            <svg
              className={`h-4 w-4 shrink-0 ${heroMode ? "text-blue-200/60" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <DatePickerButton
              label=""
              id="search-from"
              value={from}
              onChange={(iso) => {
                setFrom(iso);
                if (to && to <= iso) setTo("");
              }}
              rangeTo={to || undefined}
              openSignal={fromSignal}
              compact
              heroMode={heroMode}
            />
          </div>
        </div>

        <div className={dividerCls} aria-hidden="true" />

        {/* ── 3. Salida (DatePicker) ── */}
        <div
          ref={toContainerRef}
          className={fieldContainerClass}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            setToSignal((n) => n + 1);
          }}
        >
          <span className={labelCls}>Salida</span>
          <div className="flex items-center gap-2">
            <svg
              className={`h-4 w-4 shrink-0 ${heroMode ? "text-blue-200/60" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <DatePickerButton
              label=""
              id="search-to"
              value={to}
              minDate={from || undefined}
              onChange={setTo}
              rangeFrom={from || undefined}
              rangeTo={to || undefined}
              openSignal={toSignal}
              compact
              heroMode={heroMode}
            />
          </div>
        </div>

        <div className={dividerCls} aria-hidden="true" />

        {/* ── 4. Huéspedes Seleccionable ── */}
        <div
          ref={guestsContainerRef}
          className={`relative ${fieldContainerClass}`}
          onClick={() => {
            setIsGuestsOpen((prev) => !prev);
            setIsCityOpen(false);
          }}
        >
          <div className="flex items-center justify-between">
            <span className={labelCls}>Huéspedes</span>
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${
                heroMode ? "text-blue-200/50" : "text-gray-400"
              } ${isGuestsOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <svg
              className={`h-4 w-4 shrink-0 ${heroMode ? "text-blue-200/60" : "text-gray-400"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className={inputCls}>
              {guests} {Number(guests) === 1 ? "huésped" : "huéspedes"}
            </span>
          </div>

          {/* Menú desplegable de huéspedes (portal: por encima de todo) */}
          <Popover
            anchorRef={guestsContainerRef}
            open={isGuestsOpen}
            onClose={() => setIsGuestsOpen(false)}
            align="right"
          >
            <div className="w-72 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl dark:border-brand-navy-700 dark:bg-brand-navy-800">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Seleccioná cantidad
              </div>

              <div className="space-y-1 mt-1">
                {GUEST_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGuests(opt.value);
                      setIsGuestsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                      guests === opt.value
                        ? "bg-brand-gold/15 text-brand-navy dark:text-brand-gold font-bold"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-brand-navy-700"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-brand-navy dark:text-white">
                        {opt.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {opt.desc}
                      </div>
                    </div>
                    {guests === opt.value && (
                      <span className="text-brand-gold font-bold text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Popover>
        </div>

        {/* ── 5. Botón de búsqueda ── */}
        <div className="flex shrink-0 items-center p-1">
          <button
            type="submit"
            className="btn-primary h-full min-h-[48px] w-full rounded-xl px-6 md:w-auto"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Buscar
          </button>
        </div>
      </div>
    </form>
  );
}
