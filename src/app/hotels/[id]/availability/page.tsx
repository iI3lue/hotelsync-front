import {
  fetchAvailability,
  fetchHotelById,
  fetchRoomTypes,
  withSearch,
  type SearchState,
} from "@/lib/api";
import AvailabilityForm from "@/components/AvailabilityForm";
import Breadcrumbs from "@/components/Breadcrumbs";

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
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={[
          {
            label: hotel?.name ?? "Hotel",
            href: withSearch(`/hotels/${id}`, search),
          },
          { label: "Disponibilidad" },
        ]}
      />
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-extrabold text-brand-navy dark:text-white md:text-4xl">
          Disponibilidad y Tarifas
        </h1>
        {hotel ? (
          <div className="mt-2 space-y-1">
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {hotel.name} · {hotel.city}, {hotel.country}
            </p>
            {hotel.address && (
              <p className="text-xs text-brand-gold flex items-center gap-1.5 font-medium">
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{hotel.address}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Consultá disponibilidad en vivo por tipo de habitación y fecha.
          </p>
        )}
      </div>
      <AvailabilityForm
        hotelId={id}
        roomTypes={roomTypes}
        initialRoomTypeId={room_type_id ?? ""}
        initialDate={date ?? ""}
        initialAvailability={availability}
        search={search}
      />
    </div>
  );
}
