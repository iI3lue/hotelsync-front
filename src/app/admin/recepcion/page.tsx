import type { Metadata } from "next";
import ReceptionBoard from "@/components/ReceptionBoard";
import BookingsAutoTable from "@/components/BookingsAutoTable";
import DatePickerButton from "@/components/DatePickerButton";
import { fetchHotelById, fetchHotels } from "@/lib/api";
import { getSessionScope } from "@/lib/server-session";

export const metadata: Metadata = {
  title: "Recepción",
  description: "Reservas automáticas desde Booking y llegadas del día con check-in y check-out.",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

/** Label y caja compartidos por Hotel y Fecha para que ambas columnas queden alineadas. */
const fieldLabelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300";
const fieldBoxClass =
  "h-10 w-full rounded-xl border border-gray-200 bg-brand-cream-700 px-3 text-sm font-medium text-brand-navy transition-colors focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:border-white/10 dark:bg-brand-navy dark:text-gray-50";
const dateTriggerClass = `inline-flex items-center text-left touch-manipulation ${fieldBoxClass}`;

export default async function RecepcionPage({
  searchParams,
}: {
  searchParams: Promise<{ hotel_id?: string; date?: string; tab?: string }>;
}) {
  const { hotel_id, date, tab } = await searchParams;
  const session = await getSessionScope();
  const isReceptionist = session.role === "RECEPTIONIST";
  const assignedHotelId = session.hotel_id;

  let hotels: { hotel_id: string; name: string }[] = [];
  if (isReceptionist) {
    // El recepcionista solo opera su hotel asignado: no se lista el
    // catálogo completo ni se acepta ?hotel_id= de otro hotel.
    if (assignedHotelId) {
      try {
        const assigned = await fetchHotelById(assignedHotelId);
        hotels = [{ hotel_id: assigned.hotel_id, name: assigned.name }];
      } catch {
        hotels = [{ hotel_id: assignedHotelId, name: "Mi hotel asignado" }];
      }
    } else {
      hotels = [];
    }
  } else {
    try {
      hotels = await fetchHotels();
    } catch {
      hotels = [];
    }
  }

  // Para RECEPTIONIST se ignora el ?hotel_id= manipulado: siempre el
  // hotel de su asignación. El backend (requireDeskScope) lo revalida
  // con 403 ante cualquier intento de operar otro hotel.
  const effectiveHotel = isReceptionist
    ? (assignedHotelId ?? "")
    : hotel_id || hotels[0]?.hotel_id || "";
  // Fecha vacía = "todas las fechas" (solo aplica al tab Reservas;
  // Llegadas es vista-día y usa hoy como fallback).
  const effectiveDate = date || "";
  const boardDate = effectiveDate || todayIso();
  const activeTab = tab === "llegadas" ? "llegadas" : "reservas";
  const ready = Boolean(effectiveHotel);

  const baseParams = new URLSearchParams();
  if (effectiveHotel) baseParams.set("hotel_id", effectiveHotel);
  if (effectiveDate) baseParams.set("date", effectiveDate);
  const reservasHref = `/admin/recepcion?${new URLSearchParams({ ...Object.fromEntries(baseParams), tab: "reservas" }).toString()}`;
  const llegadasHref = `/admin/recepcion?${new URLSearchParams({ ...Object.fromEntries(baseParams), tab: "llegadas" }).toString()}`;
  const allDatesHref = `/admin/recepcion?${new URLSearchParams({
    ...(effectiveHotel ? { hotel_id: effectiveHotel } : {}),
    tab: activeTab,
  }).toString()}`;
  const todayHref = `/admin/recepcion?${new URLSearchParams({
    ...(effectiveHotel ? { hotel_id: effectiveHotel } : {}),
    date: todayIso(),
    tab: activeTab,
  }).toString()}`;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4">
      <div className="mb-6 space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-3xl">
            Recepción y Check-in
          </h1>
          <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-semibold text-brand-gold">
            Front Desk
          </span>
        </div>
        <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Control de llegadas confirmadas, asignación de habitación física y check-in/out operativo.
        </p>
      </div>

      <form
        method="get"
        action="/admin/recepcion"
        className="mb-8 rounded-2xl border border-gray-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-brand-navy-800/80"
      >
        <input type="hidden" name="tab" value={activeTab} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start">
          <div className="sm:col-span-2">
            <label htmlFor="hotel-id" className={fieldLabelClass}>
              Hotel
            </label>
            {isReceptionist ? (
              effectiveHotel ? (
                <>
                  <input type="hidden" name="hotel_id" value={effectiveHotel} />
                  <p
                    id="hotel-id"
                    className={`flex items-center ${fieldBoxClass}`}
                  >
                    {hotels[0]?.name ?? "Mi hotel asignado"}
                  </p>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Operás el hotel asignado a tu cuenta. No podés cambiar a otro hotel.
                  </p>
                </>
              ) : (
                <p
                  id="hotel-id"
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
                >
                  Tu cuenta no tiene un hotel asignado. Pedile a tu manager que revise tu
                  asignación antes de operar recepción.
                </p>
              )
            ) : hotels.length > 0 ? (
              <select
                id="hotel-id"
                name="hotel_id"
                defaultValue={effectiveHotel}
                className={fieldBoxClass}
              >
                {hotels.map((h) => (
                  <option key={h.hotel_id} value={h.hotel_id}>
                    {h.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="hotel-id"
                name="hotel_id"
                type="text"
                autoComplete="off"
                spellCheck={false}
                defaultValue={effectiveHotel}
                placeholder="Pegá el hotel_id…"
                className="h-10 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 transition-colors focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:border-white/10 dark:bg-brand-navy-900 dark:text-white"
              />
            )}
          </div>
          <div>
            <DatePickerButton
              name="date"
              label="Fecha"
              defaultValue={effectiveDate}
              triggerClassName={dateTriggerClass}
              labelClassName={fieldLabelClass}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/6">
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-navy px-4 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-brand-navy-900 active:scale-95 dark:bg-brand-gold dark:text-brand-navy dark:hover:bg-brand-gold-dark"
          >
            Filtrar
          </button>
          {effectiveDate ? (
            <a
              href={allDatesHref}
              className="text-xs font-medium text-brand-gold hover:underline"
            >
              Ver todas las fechas
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-gold/10 px-2.5 py-1 text-xs font-medium text-brand-navy dark:text-brand-gold">
              Todas las fechas ·{" "}
              <a href={todayHref} className="font-bold underline underline-offset-2 hover:no-underline">
                volver a hoy
              </a>
            </span>
          )}
        </div>
      </form>

      {!ready ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-500 dark:border-white/10 dark:text-gray-400">
          Todavía no hay hoteles cargados. Creá uno primero para operar recepción.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-white/10" role="tablist" aria-label="Vistas de recepción">
            <a
              href={reservasHref}
              role="tab"
              aria-selected={activeTab === "reservas"}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all touch-manipulation ${
                activeTab === "reservas"
                  ? "bg-brand-gold text-brand-navy shadow-xs"
                  : "border border-gray-200/80 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-brand-navy-800 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Reservas (auto)
            </a>
            <a
              href={llegadasHref}
              role="tab"
              aria-selected={activeTab === "llegadas"}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all touch-manipulation ${
                activeTab === "llegadas"
                  ? "bg-brand-gold text-brand-navy shadow-xs"
                  : "border border-gray-200/80 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-brand-navy-800 dark:text-gray-300 dark:hover:bg-white/5"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Llegadas del día
            </a>
          </div>

          {activeTab === "reservas" ? (
            <BookingsAutoTable hotelId={effectiveHotel} date={effectiveDate} />
          ) : (
            <ReceptionBoard hotelId={effectiveHotel} date={boardDate} />
          )}
        </div>
      )}
    </div>
  );
}
