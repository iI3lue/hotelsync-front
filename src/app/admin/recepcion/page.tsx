import type { Metadata } from "next";
import ReceptionBoard from "@/components/ReceptionBoard";
import BookingsAutoTable from "@/components/BookingsAutoTable";
import DatePickerButton from "@/components/DatePickerButton";
import { fetchHotelById, fetchHotels } from "@/lib/api";
import { getSessionScope } from "@/lib/server-session";

export const metadata: Metadata = {
  title: "Recepción en HotelSync",
  description: "Reservas automáticas desde Booking y llegadas del día con check-in y check-out.",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputClass =
  "rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

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
  let assignedHotelName = "";
  if (isReceptionist) {
    // El recepcionista solo opera su hotel asignado: no se lista el
    // catálogo completo ni se acepta ?hotel_id= de otro hotel.
    if (assignedHotelId) {
      try {
        const assigned = await fetchHotelById(assignedHotelId);
        assignedHotelName = assigned.name;
      } catch {
        assignedHotelName = "Mi hotel asignado";
      }
      hotels = [{ hotel_id: assignedHotelId, name: assignedHotelName }];
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Recepción</h1>
      <p className="mb-6 max-w-2xl break-words text-gray-600 dark:text-gray-300">
        Reservas automáticas desde Booking Service (pending incluidas) y llegadas
        del día desde Front Desk (solo confirmed del read model por eventos).
        Check-in con habitación física y check-out (emite{" "}
        <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">checkout.completed</code>).
      </p>

      <form
        method="get"
        action="/admin/recepcion"
        className="mb-6 rounded-lg bg-white p-4 shadow dark:bg-gray-800"
      >
        <input type="hidden" name="tab" value={activeTab} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div className="sm:col-span-2">
            <label htmlFor="hotel-id" className={labelClass}>
              Hotel
            </label>
            {isReceptionist ? (
              effectiveHotel ? (
                <>
                  <input type="hidden" name="hotel_id" value={effectiveHotel} />
                  <p
                    id="hotel-id"
                    className={`${inputClass} w-full bg-gray-50 dark:bg-gray-700/50`}
                  >
                    {assignedHotelName || "Mi hotel asignado"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Tu usuario no tiene hotel asignado. Pedile a tu manager que te asigne uno.
                </p>
              )
            ) : hotels.length > 0 ? (
              <select
                id="hotel-id"
                name="hotel_id"
                defaultValue={effectiveHotel}
                className={`${inputClass} w-full`}
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
                className={`${inputClass} w-full`}
              />
            )}
          </div>
          <div>
            <DatePickerButton name="date" label="Fecha" defaultValue={effectiveDate} />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
        >
          Filtrar
        </button>
        {effectiveDate ? (
          <a
            href={allDatesHref}
            className="ml-3 mt-4 inline-block rounded px-2 py-2 text-sm font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
          >
            Ver todas las fechas
          </a>
        ) : (
          <span className="ml-3 mt-4 inline-block rounded bg-blue-50 px-2 py-2 text-sm font-medium text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
            Todas las fechas ·{" "}
            <a href={todayHref} className="underline underline-offset-2 hover:no-underline">
              volver a hoy
            </a>
          </span>
        )}
      </form>

      {!ready ? (
        <p className="text-gray-500 dark:text-gray-400">
          Todavía no hay hoteles cargados. Creá uno primero para operar recepción.
        </p>
      ) : (
        <div>
          <div className="mb-4 flex gap-2" role="tablist" aria-label="Vistas de recepción">
            <a
              href={reservasHref}
              role="tab"
              aria-selected={activeTab === "reservas"}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors touch-manipulation ${
                activeTab === "reservas"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 shadow hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Reservas (auto)
            </a>
            <a
              href={llegadasHref}
              role="tab"
              aria-selected={activeTab === "llegadas"}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors touch-manipulation ${
                activeTab === "llegadas"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 shadow hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
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
