"use client";

import { useEffect, useState } from "react";
import type { RoomType, SearchState } from "@/lib/api";
import { withSearch } from "@/lib/api";
import Money from "@/components/Money";
import { me, type AuthProfile } from "@/lib/auth-client";
import { updateRoomType } from "@/lib/api-client";

interface RoomTypeCardProps {
  roomType: RoomType;
  search?: SearchState;
}

/* ─── Amenity icon mapping ───────────────────────────────────── */
const AMENITY_ICONS: Record<string, string> = {
  wifi: "📶",
  pool: "🏊",
  spa: "💆",
  gym: "🏋️",
  breakfast: "🍳",
  ac: "❄️",
  air_conditioning: "❄️",
  tv: "📺",
  parking: "🚗",
  ocean_view: "🌊",
  beach_view: "🏖️",
  balcony: "🌅",
  minibar: "🍷",
  room_service: "🛎️",
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

export default function RoomTypeCard({ roomType, search }: RoomTypeCardProps) {
  const [imageUrl, setImageUrl] = useState<string>(
    roomType.image_url || fallbackImage(roomType.name)
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
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2.5xl border border-brand-navy/8 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand-gold/40 hover:shadow-card-hover dark:border-white/8 dark:bg-brand-navy-800">
      {/* ── Foto de la Habitación ── */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <img
          src={imageUrl}
          alt={roomType.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradiente para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Badge de capacidad */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <svg className="h-3.5 w-3.5 text-brand-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span>
            {roomType.capacity} {roomType.capacity === 1 ? "huésped" : "huéspedes"}
          </span>
        </div>

        {/* Botón para Agregar / Cambiar Foto (solo staff con permiso real) */}
        {canEditPhoto && (
          <button
            type="button"
            onClick={() => {
              setTempUrl(imageUrl);
              setIsModalOpen(true);
            }}
            title="Agregar o cambiar foto de la habitación"
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/30 transition-all hover:bg-white/40 hover:scale-105 cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
            <span>Foto</span>
          </button>
        )}
      </div>

      {/* ── Contenido de la Habitación ── */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-heading text-xl font-bold text-brand-navy dark:text-white">
                {roomType.name}
              </h3>
            </div>

            <div className="text-right shrink-0">
              <span className="block text-[11px] uppercase tracking-wider text-slate-400">Desde</span>
              <div className="text-xl font-extrabold tracking-tight text-brand-navy dark:text-white tabular-nums">
                <Money amountCOP={roomType.base_rate} />
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">/ noche</span>
            </div>
          </div>

          {/* Comodidades */}
          {roomType.amenities && roomType.amenities.length > 0 && (
            <div className="mt-4">
              <ul className="flex flex-wrap gap-1.5" aria-label="Comodidades de la habitación">
                {roomType.amenities.map((amenity) => {
                  const icon = AMENITY_ICONS[amenity.toLowerCase()] ?? "✨";
                  return (
                    <li
                      key={amenity}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-brand-navy-700/60 dark:text-slate-300"
                    >
                      <span aria-hidden="true">{icon}</span>
                      <span className="capitalize">{amenity.replace(/_/g, " ")}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* ── Footer de Acción ── */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Cancelación flexible
          </span>
          <a
            href={availabilityHref}
            aria-label={`Ver disponibilidad de ${roomType.name}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-4 py-2.5 text-sm font-bold text-brand-navy shadow-gold transition-all duration-200 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold cursor-pointer"
          >
            <span>Ver disponibilidad</span>
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
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
          <div className="w-full max-w-md rounded-3xl border border-brand-navy/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-brand-navy-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h4 className="font-heading text-lg font-bold text-brand-navy dark:text-white">
                Foto de {roomType.name}
              </h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                ✕
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
