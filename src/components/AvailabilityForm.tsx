"use client";

import { useEffect, useState, useTransition } from "react";
import useSWR from "swr";
import {
  formatDate,
  formatPrice,
  withSearch,
  type Availability,
  type RoomType,
  type SearchState,
} from "@/lib/api";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import Spinner from "@/components/Spinner";
import { me, type AuthProfile } from "@/lib/auth-client";
import { updateRoomType } from "@/lib/api-client";

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

  return (
    <div className="space-y-6">
      {/* ── 1. Habitación Seleccionada y Selector Visual (Sin selects ilegibles) ── */}
      <div className="rounded-2.5xl border border-brand-navy/8 bg-white p-6 shadow-card dark:border-white/8 dark:bg-brand-navy-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
              Habitación elegida
            </span>
            <h2 className="font-heading text-xl font-bold text-white">
              {selectedRoom ? selectedRoom.name : "Seleccioná una habitación"}
            </h2>
          </div>
          {roomTypes.length > 1 && (
            <span className="text-xs text-slate-300">
              Podés cambiar de habitación con un clic abajo
            </span>
          )}
        </div>

        {/* Tarjeta destacada de la habitación activa con foto */}
        {selectedRoom && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-5 rounded-2xl border-2 border-brand-gold bg-brand-navy-800 p-4 shadow-gold dark:bg-brand-navy-900">
            {/* Foto de la habitación */}
            <div className="relative aspect-[16/10] md:aspect-auto md:h-full w-full overflow-hidden rounded-xl bg-slate-900">
              <img
                src={activeRoomPhoto}
                alt={selectedRoom.name}
                className="h-full w-full object-cover"
              />
              {canEditPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrlInput(activeRoomPhoto);
                    setIsPhotoModalOpen(true);
                  }}
                  className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20 hover:bg-black/80 transition-colors"
                  title="Cambiar o agregar foto"
                >
                  <svg className="h-3.5 w-3.5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  </svg>
                  <span>Cambiar foto</span>
                </button>
              )}
            </div>

            {/* Datos de la habitación */}
            <div className="md:col-span-2 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/20 px-2.5 py-0.5 text-xs font-bold text-brand-gold">
                    Capacidad: {selectedRoom.capacity} {selectedRoom.capacity === 1 ? "huésped" : "huéspedes"}
                  </span>
                  <span className="text-xs text-emerald-300 font-medium">
                    ✓ Confirmación directa
                  </span>
                </div>

                <div className="mt-2 text-2xl font-extrabold text-white tabular-nums">
                  {formatPrice(selectedRoom.base_rate)}{" "}
                  <span className="text-xs font-normal text-slate-300">/ noche</span>
                </div>

                {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedRoom.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-100 border border-white/15 capitalize"
                      >
                        {a.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-300">
                Seleccioná abajo tu fecha de llegada para consultar los cupos disponibles en tiempo real.
              </p>
            </div>
          </div>
        )}

        {/* Selector de habitaciones visual (pestañas legibles y atractivas) */}
        {/* Si se llegó con habitación preseleccionada, arranca colapsado para no duplicar la elección. */}
        {roomTypes.length > 1 && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Cambiar a otro tipo de habitación de este hotel
              </label>
              {initialRoomTypeId && (
                <button
                  type="button"
                  onClick={() => setShowSwitcher((v) => !v)}
                  aria-expanded={showSwitcher}
                  className="rounded-full border border-brand-gold/40 px-3 py-1 text-xs font-semibold text-brand-gold transition-colors hover:bg-brand-gold/10"
                >
                  {showSwitcher ? "Ocultar opciones" : `Cambiar habitación (${roomTypes.length} opciones)`}
                </button>
              )}
            </div>
            {(showSwitcher || !initialRoomTypeId) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {roomTypes.map((room) => {
                const isActive = room.room_type_id === roomId;
                return (
                  <button
                    key={room.room_type_id}
                    type="button"
                    onClick={() => {
                      setRoomId(room.room_type_id);
                    }}
                    className={`flex items-center justify-between rounded-xl p-3 text-left transition-all cursor-pointer ${
                      isActive
                        ? "border-2 border-brand-gold bg-brand-gold/20 shadow-sm text-white"
                        : "border border-white/15 bg-white/5 hover:border-brand-gold/50 hover:bg-white/10 text-slate-100"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-sm truncate">{room.name}</div>
                      <div className="text-xs text-slate-300">
                        {room.capacity} pers. · {formatPrice(room.base_rate)}/noche
                      </div>
                    </div>
                    {isActive ? (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-navy text-xs font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="text-xs text-brand-gold font-medium">Elegir</span>
                    )}
                  </button>
                );
              })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 2. Calendario de Disponibilidad ── */}
      <div className="rounded-2.5xl border border-brand-navy/8 bg-white p-6 shadow-card md:p-8 dark:border-white/8 dark:bg-brand-navy-800">
        <fieldset className="min-w-0">
          <legend className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Elegí la fecha de tu estancia
          </legend>
          <AvailabilityCalendar
            roomTypeId={roomId || undefined}
            selected={date || undefined}
            onSelect={(selectedIso) => {
              setDate(selectedIso);
            }}
          />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {roomId
              ? "Los días destacados en verde cuentan con unidades físicas activas e inventario inmediato."
              : "Elegí una habitación para ver los días disponibles."}
          </p>
        </fieldset>

        {/* ── 3. Resultado de Disponibilidad ── */}
        <div aria-live="polite" className="mt-6">
          {error ? (
            <p role="alert" className="animate-notice-in rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
              No se pudo consultar la disponibilidad para esa fecha. Probá con otro día o recargá la página.
            </p>
          ) : null}

          {isPending || isLoading ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-brand-navy-700/60 dark:text-slate-300">
              <Spinner label="Consultando cupos en vivo…" />
              <span>Verificando disponibilidad en tiempo real…</span>
            </div>
          ) : data && (date || submitted?.date) ? (
            <div
              key={`${submitted?.roomId}-${submitted?.date}`}
              className="animate-notice-in rounded-2xl border border-brand-gold/30 bg-gradient-to-r from-brand-gold/10 via-amber-500/5 to-transparent p-5 dark:border-brand-gold/30 dark:bg-brand-navy-700/60"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-brand-navy dark:text-white">
                  Resultado para el {formatDate(date || submitted?.date || "")}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    data.available > 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40"
                      : "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300/40"
                  }`}
                >
                  {data.available > 0 ? "✓ Disponible" : "✗ Agotado"}
                </span>
              </div>

              {selectedRoom ? (
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {selectedRoom.name} · {formatPrice(selectedRoom.base_rate)}/noche
                </p>
              ) : null}

              <p className="mt-3 text-sm tabular-nums text-slate-700 dark:text-slate-200">
                Habitaciones libres en inventario:{" "}
                <strong className="text-lg font-bold text-brand-navy dark:text-white">
                  {data.available}
                </strong>
              </p>

              {data.available === 0 ? (
                <p className="mt-2 font-semibold text-red-600 dark:text-red-400 text-sm">
                  No hay cupos disponibles para esta fecha. Probá seleccionando otro día en el calendario.
                </p>
              ) : data.available <= 2 ? (
                <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  ¡Quedan solo {data.available} disponibles! Asegurá tu reserva ahora.
                </p>
              ) : null}

              {data.available > 0 && (
                <div className="mt-5">
                  <a
                    href={withSearch("/reservas/nueva", search, {
                      hotel: hotelId,
                      room_type_id: roomId,
                      date: date || submitted?.date,
                    })}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-6 py-3 text-sm font-bold text-brand-navy shadow-gold transition-all duration-200 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold cursor-pointer"
                  >
                    <span>Continuar con la reserva</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          ) : !date ? (
            <p className="text-xs text-slate-400 italic">
              Tocá cualquier fecha en el calendario para consultar su stock.
            </p>
          ) : null}
        </div>
      </div>

      {/* ── Modal de Agregar / Cambiar Foto de Habitación ── */}
      {isPhotoModalOpen && selectedRoom && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-brand-navy-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h4 className="font-heading text-lg font-bold text-brand-navy dark:text-white">
                Foto de {selectedRoom.name}
              </h4>
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                ✕
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
