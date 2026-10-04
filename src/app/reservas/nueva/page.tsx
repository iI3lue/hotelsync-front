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
    <div>
      <Breadcrumbs items={[{ label: "Reserva" }]} />
      <h1 className="mb-2 text-balance text-3xl font-bold">Tu reserva</h1>
      <p className="mb-6 max-w-2xl break-words text-gray-600 dark:text-gray-300">
        Elegí tus fechas y confirmá: tu habitación queda reservada al instante,
        sin sobreventa.
      </p>
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
          className="rounded-lg bg-white p-8 text-center shadow-md dark:bg-gray-800"
        >
          <h2 className="mb-2 text-xl font-semibold text-balance">
            Todavía no elegiste un hotel
          </h2>
          <p className="mx-auto mb-6 max-w-md break-words text-gray-600 dark:text-gray-300">
            Para reservar necesitás elegir primero el hotel, el tipo de
            habitación y las fechas de tu estancia.
          </p>
          <a
            href={withSearch("/buscar", search)}
            className="inline-block rounded bg-blue-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
          >
            Buscar hoteles
          </a>
        </div>
      )}
    </div>
  );
}
