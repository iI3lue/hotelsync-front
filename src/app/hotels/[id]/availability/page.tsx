import {
  fetchAvailability,
  fetchHotelById,
  fetchRoomTypes,
  withSearch,
  type SearchState,
} from "@/lib/api";
import AvailabilityForm from "@/components/AvailabilityForm";
import PageHeader from "@/components/ui/PageHeader";
import LocalTime from "@/components/ui/LocalTime";

export default async function AvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchState>;
}) {
  const { id } = await params;
  const state = await searchParams;
  const { room_type_id, date } = state;

  const search: SearchState = {
    city: state.city,
    from: state.from,
    to: state.to,
    guests: state.guests,
    amenity: state.amenity,
    minCap: state.minCap,
    sort: state.sort,
    room_type_id: state.room_type_id,
    date: state.date,
  };

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
      <PageHeader
        crumbs={[
          { label: hotel?.name ?? "Hotel", href: withSearch(`/hotels/${id}`, search) },
          { label: "Disponibilidad" },
        ]}
        eyebrow={hotel ? `${hotel.city} · ${hotel.country}` : "Disponibilidad"}
        title="Fechas y tarifas"
        lead={
          hotel
            ? <>Elegí habitación y fecha para ver cuántas quedan libres en <span className="text-brand-navy dark:text-white">{hotel.name}</span>.</>
            : "Consultá disponibilidad en vivo por tipo de habitación y fecha."
        }
        aside={
          hotel ? (
            <dl className="text-right text-[0.875rem] text-brand-navy/60 dark:text-white/55">
              {hotel.address && <dd>{hotel.address}</dd>}
              <dd className="mt-1">
                Hora local <LocalTime timeZone={hotel.timezone} className="text-brand-navy dark:text-white" />
              </dd>
            </dl>
          ) : null
        }
      />
      <div className="shell">
        <AvailabilityForm
          hotelId={id}
          roomTypes={roomTypes}
          initialRoomTypeId={room_type_id ?? ""}
          initialDate={date ?? ""}
          initialAvailability={availability}
          search={search}
        />
      </div>
    </div>
  );
}
