import { redirect } from "next/navigation";
import { fetchHotelById, fetchRoomTypes } from "@/lib/api";
import { getSessionScope } from "@/lib/server-session";
import InventoryTable from "@/components/InventoryTable";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // El manager solo opera su hotel: un id ajeno redirige al propio.
  const session = await getSessionScope();
  if (session.role === "MANAGER" && session.hotel_id !== id) {
    redirect(session.hotel_id ? `/admin/hotels/${session.hotel_id}/inventory` : "/admin");
  }

  let hotelName = "este hotel";
  try {
    const hotel = await fetchHotelById(id);
    hotelName = hotel.name;
  } catch {
    hotelName = "este hotel";
  }

  let roomTypes: Awaited<ReturnType<typeof fetchRoomTypes>> = [];
  try {
    roomTypes = await fetchRoomTypes(id);
  } catch {
    roomTypes = [];
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Gestión de inventario</h1>
      <p className="text-gray-600 mb-4 dark:text-gray-300">
        Disponibilidad y bloqueos de <strong>{hotelName}</strong> por
        mantenimiento.
      </p>

      <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
        <InventoryTable hotelId={id} roomTypes={roomTypes} />
      </div>
    </div>
  );
}
