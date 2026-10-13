import { fetchArrivals, fetchBookings, fetchHotelById, fetchHotels } from "@/lib/api";
import { getSessionScope } from "@/lib/server-session";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const session = await getSessionScope();
  // El manager solo opera su hotel asignado.
  const isManager = session.role === "MANAGER";
  const assignedHotelId = session.hotel_id;

  let hotelsCount = 0;
  let firstHotelId = "";
  if (isManager) {
    if (assignedHotelId) {
      try {
        const assigned = await fetchHotelById(assignedHotelId);
        hotelsCount = 1;
        firstHotelId = assigned.hotel_id;
      } catch {
        hotelsCount = 0;
      }
    }
  } else {
    try {
      const hotels = await fetchHotels();
      hotelsCount = hotels.length;
      firstHotelId = hotels[0]?.hotel_id || "";
    } catch {
      hotelsCount = 0;
    }
  }

  let arrivalsToday = 0;
  let pendingCount = 0;
  if (firstHotelId) {
    const today = todayIso();
    try {
      const [arrivals, pending] = await Promise.all([
        fetchArrivals(firstHotelId, today).catch(() => []),
        fetchBookings({ hotel_id: firstHotelId, status: "pending", date: today }).catch(() => []),
      ]);
      arrivalsToday = arrivals.length;
      pendingCount = pending.length;
    } catch {
      arrivalsToday = 0;
      pendingCount = 0;
    }
  }

  const receptionHref = firstHotelId
    ? `/admin/recepcion?hotel_id=${firstHotelId}&date=${todayIso()}`
    : "/admin/recepcion";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Panel principal</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            Hoteles
          </h2>
          <p className="mt-2 text-3xl font-bold tabular-nums" role="status">
            {hotelsCount}
          </p>
          <p className="mt-2">
            <a
              href="/admin/hotels"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Administrar
            </a>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            Recepción
          </h2>
          <p className="mt-2 text-sm text-gray-600 tabular-nums dark:text-gray-300" role="status">
            {arrivalsToday} llegadas hoy · {pendingCount} pendientes
          </p>
          <p className="text-3xl font-bold mt-2">
            <a
              href={receptionHref}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Check-in / out
            </a>
          </p>
        </div>
        {(isManager || session.role === "SUPER_ADMIN") ? (
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
              Personal
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {isManager
                ? "Cuentas de recepción y limpieza de tu hotel."
                : "Cuentas de personal y roles por hotel."}
            </p>
            <p className="mt-2">
              <a
                href="/admin/staff"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Gestionar
              </a>
            </p>
          </div>
        ) : null}
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            Tipos de habitación
          </h2>
          <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
            Se gestionan desde el detalle de cada hotel
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-300">
            Inventario
          </h2>
          <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">
            Se gestiona desde el detalle de cada hotel
          </p>
        </div>
      </div>
    </div>
  );
}
