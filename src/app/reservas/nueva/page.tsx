import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookingForm from "@/components/BookingForm";
import AvailabilityForm from "@/components/AvailabilityForm";
import {
  fetchHotelById,
  fetchRoomTypes,
  withSearch,
  type SearchState,
} from "@/lib/api";

export const metadata: Metadata = {
  title: "Nueva reserva en HotelSync",
  description: "Completá tu reserva directa con confirmación sin sobreventa.",
};

export default async function NuevaReservaPage({
  searchParams,
}: {
  searchParams: Promise<SearchState>;
}) {
  const state = await searchParams;
  const { hotel, room_type_id, date } = state;

  const search: SearchState = {
    city: state.city,
    from: state.from,
    to: state.to,
    guests: state.guests,
    amenity: state.amenity,
    minCap: state.minCap,
    sort: state.sort,
    hotel: state.hotel,
    room_type_id: state.room_type_id,
    date: state.date,
  };

  const ready = Boolean(hotel && room_type_id);

  const [hotelData, roomTypes] = hotel
    ? await Promise.all([
        fetchHotelById(hotel).catch(() => null),
        fetchRoomTypes(hotel).catch(() => []),
      ])
    : [null, []];
  const roomType = roomTypes.find((r) => r.room_type_id === room_type_id);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8">
      <Breadcrumbs items={[{ label: "Reserva" }]} />
      <div className="border-b border-slate-100 pb-6 dark:border-brand-navy-800">
        <h1 className="font-heading text-3xl font-extrabold text-brand-navy dark:text-white md:text-4xl">
          Completá tu Reserva
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Confirmación directa e inmediata sin sobreventa. Tu estancia garantizada.
        </p>
      </div>

      {ready && roomType ? (
        <BookingForm
          hotelId={hotel!}
          hotelName={hotelData?.name ?? "Tu hotel"}
          roomType={roomType}
          date={date ?? ""}
          initialFrom={state.from}
          initialTo={state.to}
        />
      ) : hotel ? (
        <AvailabilityForm
          hotelId={hotel}
          roomTypes={roomTypes}
          initialRoomTypeId={room_type_id ?? ""}
          initialDate={date ?? ""}
          search={search}
        />
      ) : (
        <div
          role="status"
          className="rounded-2.5xl border border-slate-200/80 bg-white p-12 text-center shadow-card dark:border-brand-navy-700/80 dark:bg-brand-navy-800"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-2xl dark:bg-brand-navy-900">
            🏨
          </div>
          <h2 className="font-heading text-2xl font-bold text-brand-navy dark:text-white">
            Todavía no elegiste un hotel
          </h2>
          <p className="mx-auto mt-2 mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
            Para reservar necesitás elegir primero el hotel, el tipo de
            habitación y las fechas de tu estancia.
          </p>
          <a
            href={withSearch("/buscar", search)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-gold to-amber-500 px-6 py-3 text-sm font-bold text-brand-navy shadow-gold transition-all duration-200 hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold touch-manipulation"
          >
            <span>Buscar hoteles</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
