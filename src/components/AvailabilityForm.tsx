"use client";

import { useEffect, useState, useTransition } from "react";
import useSWR from "swr";
import {
  formatDate,
  withSearch,
  type Availability,
  type RoomType,
  type SearchState,
} from "@/lib/api";
import Money from "@/components/Money";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import Spinner from "@/components/Spinner";
import { me, type AuthProfile } from "@/lib/auth-client";
import { updateRoomType } from "@/lib/api-client";
import { AmenityList } from "@/components/ui/Amenity";
import Arrow from "@/components/ui/Arrow";

interface AvailabilityFormProps {
  hotelId: string;
  roomTypes: RoomType[];
  initialRoomTypeId?: string;
  initialDate?: string;
  initialAvailability?: Availability | null;
  search?: SearchState;
}

const fetcher = async (url: string): Promise<Availability> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo consultar la disponibilidad");
  return res.json();
};

const ROOM_PRESET_IMAGES = [
  {
    label: "Suite Deluxe",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Doble Estándar",
    url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Vista al Mar",
    url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Chalet de Montaña",
    url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
  },
];

function fallbackImage(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("deluxe") || n.includes("suite") || n.includes("king")) return ROOM_PRESET_IMAGES[0].url;
  if (n.includes("beach") || n.includes("mar") || n.includes("caribe") || n.includes("ocean")) return ROOM_PRESET_IMAGES[2].url;
  if (n.includes("chalet") || n.includes("alpine") || n.includes("wine") || n.includes("cava")) return ROOM_PRESET_IMAGES[3].url;
  return ROOM_PRESET_IMAGES[1].url;
}

export default function AvailabilityForm({
  hotelId,
  roomTypes,
  initialRoomTypeId = "",
  initialDate = "",
  initialAvailability = null,
  search,
}: AvailabilityFormProps) {
  // Si no se pasó room_type_id, se preselecciona la primera habitación del hotel
  const defaultRoomId = initialRoomTypeId || (roomTypes.length > 0 ? roomTypes[0].room_type_id : "");
  const [roomId, setRoomId] = useState(defaultRoomId);
  const [date, setDate] = useState(initialDate);
  const [submitted, setSubmitted] = useState<{ roomId: string; date: string } | null>(
    defaultRoomId && initialDate ? { roomId: defaultRoomId, date: initialDate } : null
  );
  const [isPending, startTransition] = useTransition();

  // Modal para agregar o cambiar foto de la habitación
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [customPhotos, setCustomPhotos] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  // Si se llegó con habitación preseleccionada (deep-link desde la card),
  // el selector arranca colapsado para no duplicar la elección.
  const [showSwitcher, setShowSwitcher] = useState(!initialRoomTypeId);

  useEffect(() => {
    void me().then(setProfile);
  }, []);

  // Mismo criterio que el backend (requireCatalogScope): MANAGER del hotel
  // o SUPER_ADMIN. Al resto se le oculta el botón (su guardado no persistiría).
  const canEditPhoto =
    profile?.role === "SUPER_ADMIN" ||
    (profile?.role === "MANAGER" && profile?.hotel_id === hotelId);

  const selectedRoom = roomTypes.find((r) => r.room_type_id === roomId);
  const activeRoomPhoto =
    (selectedRoom && customPhotos[selectedRoom.room_type_id]) ||
    selectedRoom?.image_url ||
    (selectedRoom ? fallbackImage(selectedRoom.name) : "");

  // Consultar disponibilidad automáticamente cuando hay habitación y fecha seleccionadas
  useEffect(() => {
    if (roomId && date) {
      startTransition(() => {
        setSubmitted({ roomId, date });
      });
    }
  }, [roomId, date]);

  const key =
    submitted && submitted.roomId && submitted.date
      ? `/api/rate/availability?room_type_id=${encodeURIComponent(submitted.roomId)}&date=${encodeURIComponent(submitted.date)}`
      : null;

  const { data, error, isLoading } = useSWR<Availability>(key, fetcher, {
    fallbackData: initialAvailability ?? undefined,
    revalidateOnFocus: false,
  });

  const handleSavePhoto = async () => {
    if (!selectedRoom || !photoUrlInput.trim()) return;
    setIsSavingPhoto(true);
    try {
      await updateRoomType(selectedRoom.room_type_id, { image_url: photoUrlInput.trim() });
      setCustomPhotos((prev) => ({ ...prev, [selectedRoom.room_type_id]: photoUrlInput.trim() }));
      setIsPhotoModalOpen(false);
    } catch {
      // Fallback local
      setCustomPhotos((prev) => ({ ...prev, [selectedRoom.room_type_id]: photoUrlInput.trim() }));
      setIsPhotoModalOpen(false);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const resultDate = date || submitted?.date || "";
  const bookHref = withSearch("/reservas/nueva", search, {
    hotel: hotelId,
    room_type_id: roomId,
    date: resultDate || undefined,
  });

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
      {/* ── 1. Habitación elegida (fija al costado en escritorio) ── */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow">Habitación elegida</p>
        {selectedRoom ? (
          <div className="mt-5 animate-notice-in" key={selectedRoom.room_type_id}>
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-stone dark:bg-brand-navy-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeRoomPhoto} alt={selectedRoom.name} className="h-full w-full object-cover" />
              {canEditPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrlInput(activeRoomPhoto);
                    setIsPhotoModalOpen(true);
                  }}
                  className="absolute right-3 top-3 rounded-full bg-white/90 px-3.5 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-brand-navy backdrop-blur transition-colors hover:bg-white"
                  title="Cambiar o agregar foto"
                >
                  Cambiar foto
                </button>
              )}
            </div>
            <h2 className="mt-6 font-display text-[2rem] leading-tight text-brand-navy dark:text-white">{selectedRoom.name}</h2>
            <p className="mt-1 text-[0.9rem] text-brand-navy/60 dark:text-white/55">
              Hasta {selectedRoom.capacity} {selectedRoom.capacity === 1 ? "huésped" : "huéspedes"}
            </p>
            {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
              <AmenityList amenities={selectedRoom.amenities} className="mt-5" />
            )}
            <p className="mt-6 border-t border-brand-navy/12 pt-5 text-brand-navy dark:border-white/12 dark:text-white">
              <span className="block text-eyebrow uppercase text-brand-navy/50 dark:text-white/50">Desde</span>
              <span className="font-display text-[2rem] tabular-nums"><Money amountCOP={selectedRoom.base_rate} /></span>
              <span className="ml-1.5 text-[0.85rem] text-brand-navy/50 dark:text-white/50">/ noche</span>
            </p>
          </div>
        ) : (
          <p className="mt-5 font-display text-[1.6rem] leading-snug text-brand-navy/70 dark:text-white/70">
            Elegí una habitación para ver sus días libres.
          </p>
        )}
      </aside>

      <div className="min-w-0 space-y-12">
        {/* Selector de habitaciones. Si se llegó con una preseleccionada, arranca colapsado. */}
        {roomTypes.length > 1 && (
          <section aria-labelledby="room-switch-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-navy/12 pb-4 dark:border-white/12">
              <h3 id="room-switch-title" className="eyebrow">
                {initialRoomTypeId ? "Otras habitaciones de este hotel" : "1 · Elegí la habitación"}
              </h3>
              {initialRoomTypeId && (
                <button
                  type="button"
                  onClick={() => setShowSwitcher((v) => !v)}
                  aria-expanded={showSwitcher}
                  className="text-eyebrow uppercase text-brand-navy underline underline-offset-4 dark:text-white"
                >
                  {showSwitcher ? "Ocultar" : `Ver ${roomTypes.length} opciones`}
                </button>
              )}
            </div>
            {(showSwitcher || !initialRoomTypeId) && (
              <ul className="animate-notice-in">
                {roomTypes.map((room) => {
                  const isActive = room.room_type_id === roomId;
                  return (
                    <li key={room.room_type_id} className="border-b border-brand-navy/10 dark:border-white/10">
                      <button
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setRoomId(room.room_type_id)}
                        className="group flex w-full items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="flex min-w-0 items-center gap-4">
                          <span
                            aria-hidden="true"
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              isActive ? "border-brand-navy dark:border-white" : "border-brand-navy/30 dark:border-white/30"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full bg-brand-navy transition-transform duration-300 dark:bg-white ${isActive ? "scale-100" : "scale-0"}`} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[1rem] text-brand-navy dark:text-white">{room.name}</span>
                            <span className="text-[0.8rem] text-brand-navy/50 dark:text-white/45">Hasta {room.capacity} huéspedes</span>
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums text-[0.95rem] text-brand-navy/80 dark:text-white/75">
                          <Money amountCOP={room.base_rate} /> <span className="text-[0.75rem] text-brand-navy/45 dark:text-white/40">/ noche</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* ── 2. Calendario ── */}
        <section aria-labelledby="cal-title">
          <fieldset className="min-w-0">
            <legend id="cal-title" className="eyebrow w-full border-b border-brand-navy/12 pb-4 dark:border-white/12">
              {roomTypes.length > 1 && !initialRoomTypeId ? "2 · Elegí la fecha de llegada" : "Elegí la fecha de llegada"}
            </legend>
            <div className="pt-8">
              <AvailabilityCalendar
                roomTypeId={roomId || undefined}
                selected={date || undefined}
                onSelect={(selectedIso) => {
                  setDate(selectedIso);
                }}
              />
            </div>
            <p className="mt-4 text-center text-[0.8rem] text-brand-navy/50 dark:text-white/45">
              {roomId
                ? "Los días subrayados en verde tienen habitaciones libres."
                : "Elegí una habitación para ver los días disponibles."}
            </p>
          </fieldset>

          {/* ── 3. Resultado ── */}
          <div aria-live="polite" className="mt-10">
            {error ? (
              <p role="alert" className="animate-notice-in border-l-2 border-red-600 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-300">
                No pudimos consultar esa fecha. Probá con otro día o recargá la página.
              </p>
            ) : null}

            {isPending || isLoading ? (
              <div className="flex items-center gap-3 border-t border-brand-navy/12 py-6 text-sm text-brand-navy/60 dark:border-white/12 dark:text-white/55">
                <Spinner label="Consultando cupos en vivo…" />
                <span>Consultando disponibilidad…</span>
              </div>
            ) : data && resultDate ? (
              <div
                key={`${submitted?.roomId}-${submitted?.date}`}
                className="animate-notice-in border border-brand-navy/12 bg-white p-6 dark:border-white/12 dark:bg-brand-navy-800 md:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Llegada</p>
                    <h3 className="mt-2 font-display text-[1.75rem] leading-tight text-brand-navy dark:text-white">
                      {formatDate(resultDate)}
                    </h3>
                    {selectedRoom ? (
                      <p className="mt-1 text-[0.9rem] text-brand-navy/60 dark:text-white/55">
                        {selectedRoom.name} · <Money amountCOP={selectedRoom.base_rate} /> / noche
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.12em] ${
                      data.available > 0
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                        : "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${data.available > 0 ? "bg-emerald-600" : "bg-red-600"}`} />
                    {data.available > 0 ? "Disponible" : "Agotado"}
                  </span>
                </div>

                <p className="mt-6 text-[0.95rem] text-brand-navy/70 dark:text-white/65">
                  {data.available === 0 ? (
                    "No quedan habitaciones de este tipo para esa fecha. Probá con otro día del calendario."
                  ) : (
                    <>
                      <span className="tabular-nums text-brand-navy dark:text-white">{data.available}</span>{" "}
                      {data.available === 1 ? "habitación libre" : "habitaciones libres"} para esa noche.
                      {data.available <= 2 && (
                        <span className="ml-1 text-brand-gold">Quedan pocas.</span>
                      )}
                    </>
                  )}
                </p>

                {data.available > 0 && (
                  <a href={bookHref} className="btn-primary mt-8">
                    Continuar con la reserva <Arrow className="h-2.5 w-5" />
                  </a>
                )}
              </div>
            ) : !date ? (
              <p className="border-t border-brand-navy/12 pt-6 text-[0.875rem] text-brand-navy/50 dark:border-white/12 dark:text-white/45">
                Tocá una fecha del calendario para ver cuántas habitaciones quedan.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {/* ── Modal de Agregar / Cambiar Foto de Habitación ── */}
      {isPhotoModalOpen && selectedRoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md rounded-[2px] bg-white p-7 shadow-elevated dark:bg-brand-navy-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h4 className="font-display text-xl text-brand-navy dark:text-white">
                Foto de {selectedRoom.name}
              </h4>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                aria-label="Cerrar"
                className="p-1 text-brand-navy/50 hover:text-brand-navy dark:text-white/50 dark:hover:text-white"
              >
                <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" /></svg>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-brand-navy-950">
                <img
                  src={photoUrlInput || activeRoomPhoto}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImage(selectedRoom.name);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  URL de la imagen
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 dark:border-white/15 dark:bg-brand-navy-700 dark:text-white"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Galería rápida de opciones
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {ROOM_PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPhotoUrlInput(preset.url)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                        photoUrlInput === preset.url
                          ? "border-brand-gold bg-brand-gold/10 font-bold text-brand-navy dark:text-brand-gold"
                          : "border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="h-8 w-8 rounded-lg object-cover" />
                      <span className="text-xs truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingPhoto || !photoUrlInput.trim()}
                  onClick={handleSavePhoto}
                  className="btn-primary rounded-xl px-5 py-2 text-sm font-bold"
                >
                  {isSavingPhoto ? "Guardando…" : "Guardar foto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
