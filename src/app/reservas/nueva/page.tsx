import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/EmptyState";
import BookingForm from "@/components/BookingForm";
import AvailabilityForm from "@/components/AvailabilityForm";
import {
  fetchHotelById,
  fetchRoomTypes,
  withSearch,
  type SearchState,
} from "@/lib/api";

export const metadata: Metadata = {
  title: "Tu reserva",
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
      <PageHeader
        crumbs={[
          ...(hotelData ? [{ label: hotelData.name, href: withSearch(`/hotels/${hotelData.hotel_id}`, search) }] : []),
          { label: "Reserva" },
        ]}
        eyebrow={hotelData ? `${hotelData.name} · ${hotelData.city}` : "Reserva directa"}
        title={ready && roomType ? "Completá tu reserva" : hotel ? "Elegí tu habitación" : "Empecemos por el hotel"}
        lead="Confirmación inmediata y sin sobreventa: si la ves libre, es tuya."
      />

      <div className="shell">
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
          <EmptyState
            title="Todavía no elegiste un hotel"
            description="Para reservar, elegí primero el hotel, el tipo de habitación y las fechas de tu estancia."
            actionHref={withSearch("/buscar", search)}
            actionLabel="Ver hoteles"
          />
        )}
      </div>
    </div>
  );
}
