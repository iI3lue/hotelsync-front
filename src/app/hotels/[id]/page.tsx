import {
  fetchHotelById,
  fetchRoomTypes,
  withSearch,
  type SearchState,
} from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import PriceFrom from "@/components/PriceFrom";
import RoomTypeCard from "@/components/RoomTypeCard";
import EmptyState from "@/components/EmptyState";

export default async function HotelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchState>;
}) {
  const { id } = await params;
  const state = await searchParams;
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

  // Paralelo: hotel + habitaciones (async-parallel).
  const [hotel, roomTypes] = await Promise.all([
    fetchHotelById(id).catch(() => null),
    fetchRoomTypes(id).catch(() => []),
  ]);

  if (!hotel) {
    return (
      <EmptyState
        title="No encontramos este hotel"
        description="El hotel no existe o el servicio no responde. Volvé al listado e intentá de nuevo."
        actionHref={withSearch("/", search)}
        actionLabel="Volver al inicio"
      />
    );
  }

  const rates = roomTypes.map((r) => Number(r.base_rate));
  const from = rates.length > 0 ? Math.min(...rates) : null;

  return (
    <div>
      <Breadcrumbs items={[{ label: hotel.name }]} />

      <div
        aria-hidden="true"
        className="mb-6 flex aspect-[21/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-indigo-950 text-6xl font-bold text-white"
      >
        {hotel.name.charAt(0).toUpperCase()}
      </div>

      <h1 className="mb-2 text-balance text-3xl font-bold">{hotel.name}</h1>
      <p className="mb-2 break-words text-gray-600 dark:text-gray-300">
        {hotel.city}, {hotel.country} · Zona horaria: {hotel.timezone}
      </p>
      {from !== null ? <PriceFrom rate={from} size="lg" /> : null}

      <div className="mb-8 flex flex-wrap gap-3">
        <a
          href={withSearch(`/hotels/${id}/availability`, search)}
          className="inline-block rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
        >
          Consultar disponibilidad
        </a>
        <a
          href={withSearch("/reservas/nueva", search, { room_type_id: undefined, date: undefined })}
          className="inline-block rounded px-4 py-2 font-medium text-green-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 touch-manipulation dark:text-green-400"
        >
          Reservar ahora
        </a>
      </div>

      {hotel.cancellationPolicies && hotel.cancellationPolicies.length > 0 ? (
        <section aria-labelledby="cancel-title" className="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
          <h2 id="cancel-title" className="mb-2 text-xl font-semibold">
            Política de cancelación
          </h2>
          {hotel.cancellationPolicies.map((policy) => (
            <div key={policy.policy_id} className="mb-2">
              <p className="font-medium">{policy.name}</p>
              <p className="break-words text-gray-600 dark:text-gray-300">
                {policy.description}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <h2 className="mb-4 text-balance text-2xl font-semibold">
        Tipos de habitación
      </h2>
      {roomTypes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No hay tipos de habitación disponibles.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roomTypes.map((roomType) => (
            <RoomTypeCard key={roomType.room_type_id} roomType={roomType} search={search} />
          ))}
        </div>
      )}
    </div>
  );
}
