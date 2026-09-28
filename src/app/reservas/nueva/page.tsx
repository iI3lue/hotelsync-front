import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import BookingForm from "@/components/BookingForm";
import AvailabilityForm from "@/components/AvailabilityForm";
import { fetchHotelById, fetchRoomTypes } from "@/lib/api";

export const metadata: Metadata = {
  title: "Nueva reserva en HotelSync",
  description: "Completá tu reserva directa con confirmación sin sobreventa.",
};

export default async function NuevaReservaPage({
  searchParams,
}: {
  searchParams: Promise<{ hotel?: string; room_type_id?: string; date?: string }>;
}) {
  const { hotel, room_type_id, date } = await searchParams;
  const ready = Boolean(hotel && room_type_id && date);

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
          date={date!}
        />
      ) : hotel ? (
        <AvailabilityForm
          hotelId={hotel}
          roomTypes={roomTypes}
          initialRoomTypeId={room_type_id ?? ""}
          initialDate={date ?? ""}
        />
      ) : (
        <div
          role="status"
          className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
        >
          <p className="text-gray-600 dark:text-gray-300">
            Falta el hotel. Empezá eligiendo disponibilidad desde el{" "}
            <a
              href="/"
              className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
            >
              listado de hoteles
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
