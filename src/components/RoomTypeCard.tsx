"use client";

import { useEffect, useState } from "react";
import type { RoomType, SearchState } from "@/lib/api";
import { withSearch } from "@/lib/api";
import Money from "@/components/Money";
import { me, type AuthProfile } from "@/lib/auth-client";
import { updateRoomType } from "@/lib/api-client";
import { roomImage } from "@/lib/imagery";
import Photo from "@/components/ui/Photo";
import Arrow from "@/components/ui/Arrow";
import { AmenityList } from "@/components/ui/Amenity";

interface RoomTypeCardProps {
  roomType: RoomType;
  search?: SearchState;
  /** Posición en la lista: alterna foto izquierda/derecha. */
  index?: number;
}

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
  if (n.includes("deluxe") || n.includes("suite") || n.includes("king")) {
    return ROOM_PRESET_IMAGES[0].url;
  }
  if (n.includes("beach") || n.includes("mar") || n.includes("caribe") || n.includes("ocean")) {
    return ROOM_PRESET_IMAGES[2].url;
  }
  if (n.includes("chalet") || n.includes("alpine") || n.includes("wine") || n.includes("cava")) {
    return ROOM_PRESET_IMAGES[3].url;
  }
  return ROOM_PRESET_IMAGES[1].url;
}

export default function RoomTypeCard({ roomType, search, index = 0 }: RoomTypeCardProps) {
  const [imageUrl, setImageUrl] = useState<string>(
    roomImage(roomType, 1600)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<AuthProfile | null>(null);

  useEffect(() => {
    void me().then(setProfile);
  }, []);

  // El PUT /room-types/:id exige MANAGER del hotel o SUPER_ADMIN.
  // Sin ese rol el guardado solo viviría en memoria: ocultamos el botón.
  const canEditPhoto =
    profile?.role === "SUPER_ADMIN" ||
    (profile?.role === "MANAGER" && profile?.hotel_id === roomType.hotel_id);

  const availabilityHref = withSearch(
    `/hotels/${encodeURIComponent(roomType.hotel_id)}/availability`,
    search,
    { room_type_id: roomType.room_type_id, date: undefined }
  );

  const bookHref = withSearch("/reservas/nueva", search, {
    hotel: roomType.hotel_id,
    room_type_id: roomType.room_type_id,
    date: undefined,
  });
  const flip = index % 2 === 1;

  const handleSavePhoto = async () => {
    if (!tempUrl.trim()) return;
    setIsSaving(true);
    try {
      await updateRoomType(roomType.room_type_id, { image_url: tempUrl.trim() });
      setImageUrl(tempUrl.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
      }, 800);
    } catch {
      // Fallback local en caso de que no haya sesión de admin
      setImageUrl(tempUrl.trim());
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="group grid items-center gap-8 md:grid-cols-12 md:gap-12">
      {/* ── Foto ── */}
      <div
        data-reveal="image"
        className={`relative aspect-[4/3] w-full overflow-hidden bg-brand-stone dark:bg-brand-navy-800 md:col-span-7 ${flip ? "md:order-2" : ""}`}
      >
        <Photo
          src={imageUrl}
          alt={roomType.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-1200 ease-silk group-hover:scale-[1.03]"
        />

        {/* Botón para Agregar / Cambiar Foto (solo staff con permiso real) */}
        {canEditPhoto && (
          <button
            type="button"
            onClick={() => {
              setTempUrl(imageUrl);
              setIsModalOpen(true);
            }}
            title="Agregar o cambiar foto de la habitación"
            className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-brand-navy backdrop-blur transition-colors hover:bg-white"
          >
            Cambiar foto
          </button>
        )}
      </div>

      {/* ── Texto ── */}
      <div
        data-reveal=""
        style={{ ["--reveal-delay" as string]: "150ms" }}
        className={`md:col-span-5 ${flip ? "md:order-1 md:pr-4" : "md:pl-4"}`}
      >
        <p className="eyebrow">
          Hasta {roomType.capacity} {roomType.capacity === 1 ? "huésped" : "huéspedes"}
        </p>
        <h3 className="mt-4 font-display text-display-sm text-brand-navy dark:text-white">
          {roomType.name}
        </h3>

        {roomType.amenities && roomType.amenities.length > 0 && (
          <AmenityList amenities={roomType.amenities} className="mt-7" />
        )}

        <div className="mt-9 flex items-end justify-between gap-6 border-t border-brand-navy/12 pt-6 dark:border-white/12">
          <p className="leading-tight text-brand-navy dark:text-white">
            <span className="block text-eyebrow uppercase text-brand-navy/50 dark:text-white/50">Desde</span>
            <span className="font-display text-[2rem] tabular-nums"><Money amountCOP={roomType.base_rate} /></span>
            <span className="ml-1.5 text-[0.85rem] text-brand-navy/50 dark:text-white/50">/ noche</span>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a href={availabilityHref} aria-label={`Ver disponibilidad de ${roomType.name}`} className="btn-primary">
            Ver disponibilidad
          </a>
          <a href={bookHref} aria-label={`Reservar ${roomType.name}`} className="link-line text-brand-navy dark:text-white">
            Reservar <Arrow className="h-2.5 w-5" />
          </a>
        </div>
      </div>

      {/* ── Modal para Agregar / Cambiar Foto de la Habitación ── */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md rounded-[2px] bg-white p-7 shadow-elevated dark:bg-brand-navy-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h4 className="font-display text-xl text-brand-navy dark:text-white">
                Foto de {roomType.name}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar"
                className="p-1 text-brand-navy/50 hover:text-brand-navy dark:text-white/50 dark:hover:text-white"
              >
                <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" /></svg>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Vista previa */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-brand-navy-950">
                <img
                  src={tempUrl || imageUrl}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackImage(roomType.name);
                  }}
                />
              </div>

              {/* Input URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Pegá la URL de la imagen
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-brand-navy outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 dark:border-white/15 dark:bg-brand-navy-700 dark:text-white"
                />
              </div>

              {/* Presets rápidos */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  O elegí una foto predefinida
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {ROOM_PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTempUrl(preset.url)}
                      className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                        tempUrl === preset.url
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

              {/* Acciones */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSaving || !tempUrl.trim()}
                  onClick={handleSavePhoto}
                  className="btn-primary rounded-xl px-5 py-2 text-sm font-bold"
                >
                  {saveSuccess ? "¡Guardado!" : isSaving ? "Guardando…" : "Guardar foto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
