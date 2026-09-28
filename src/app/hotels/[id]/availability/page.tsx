import { fetchAvailability, fetchHotelById, fetchRoomTypes } from "@/lib/api";
import AvailabilityForm from "@/components/AvailabilityForm";
import Breadcrumbs from "@/components/Breadcrumbs";

export default async function AvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ room_type_id?: string; date?: string }>;
}) {
  const { id } = await params;
  const { room_type_id, date } = await searchParams;

  // Paralelo: hotel + habitaciones a la vez (async-parallel).
  const [hotel, roomTypes] = await Promise.all([
    fetchHotelById(id).catch(() => null),
    fetchRoomTypes(id).catch(() => []),
  ]);

  let availability = null;
  if (room_type_id && date) {
    try {
      availability = await fetchAvailability(room_type_id, date);
    } catch {
      availability = null;
    }
  }

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: hotel?.name ?? "Hotel", href: `/hotels/${id}` },
          { label: "Disponibilidad" },
        ]}
      />
      <h1 className="mb-2 text-balance text-3xl font-bold">
        Consultar disponibilidad
      </h1>
      {hotel ? (
        <p className="mb-8 break-words text-gray-600 dark:text-gray-300">
          {hotel.name} · {hotel.city}, {hotel.country}
        </p>
      ) : (
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          Consultá disponibilidad por tipo de habitación y fecha.
        </p>
      )}
      <AvailabilityForm
        hotelId={id}
        roomTypes={roomTypes}
        initialRoomTypeId={room_type_id ?? ""}
        initialDate={date ?? ""}
        initialAvailability={availability}
      />
    </div>
  );
}
