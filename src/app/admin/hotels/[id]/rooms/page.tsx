import { redirect } from "next/navigation";
import { fetchPhysicalRooms, fetchRoomTypes } from "@/lib/api";
import { getSessionScope } from "@/lib/server-session";
import PhysicalRoomForm from "@/components/PhysicalRoomForm";
import RoomTypeForm from "@/components/RoomTypeForm";

export default async function RoomTypesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // El manager solo opera su hotel: un id ajeno redirige al propio.
  const session = await getSessionScope();
  if (session.role === "MANAGER" && session.hotel_id !== id) {
    redirect(session.hotel_id ? `/admin/hotels/${session.hotel_id}/rooms` : "/admin");
  }
  const [roomTypes, physicalRooms] = await Promise.all([
    fetchRoomTypes(id),
    fetchPhysicalRooms(id),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tipos de habitación</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-4">Agregar tipo de habitación</h2>
        <RoomTypeForm hotelId={id} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">
                Capacidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">
                Tarifa base
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-gray-300">
                Servicios
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {roomTypes.map((rt) => (
              <tr key={rt.room_type_id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {rt.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{rt.capacity}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${Number(rt.base_rate).toLocaleString("es-AR")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {rt.amenities?.join(", ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10" aria-labelledby="physical-rooms-heading">
        <h2 id="physical-rooms-heading" className="mb-2 text-2xl font-semibold">
          Habitaciones físicas
        </h2>
        <p className="mb-5 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
          Registrá cada unidad del hotel. Al darla de alta, su disponibilidad se agrega a R&A desde la fecha indicada.
        </p>

        <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <PhysicalRoomForm hotelId={id} roomTypes={roomTypes} />
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="break-words px-2 py-3 text-left text-[10px] font-medium uppercase text-gray-500 dark:text-gray-300 md:px-6 md:text-xs">
                  Habitación
                </th>
                <th className="break-words px-2 py-3 text-left text-[10px] font-medium uppercase text-gray-500 dark:text-gray-300 md:px-6 md:text-xs">
                  Tipo
                </th>
                <th className="break-words px-2 py-3 text-left text-[10px] font-medium uppercase text-gray-500 dark:text-gray-300 md:px-6 md:text-xs">
                  Disponible desde
                </th>
                <th className="break-words px-2 py-3 text-left text-[10px] font-medium uppercase text-gray-500 dark:text-gray-300 md:px-6 md:text-xs">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {physicalRooms.map((room) => (
                <tr key={room.physical_room_id}>
                  <td className="break-all px-2 py-3 text-xs font-medium md:px-6 md:py-4 md:text-sm">
                    {room.room_number}
                  </td>
                  <td className="break-words px-2 py-3 text-xs md:px-6 md:py-4 md:text-sm">
                    {room.roomType.name}
                  </td>
                  <td className="break-words px-2 py-3 text-xs tabular-nums md:px-6 md:py-4 md:text-sm">
                    {room.available_from.slice(0, 10)}
                  </td>
                  <td className="break-words px-2 py-3 text-xs md:px-6 md:py-4 md:text-sm">
                    {room.is_active ? "Activa" : "Inactiva"}
                  </td>
                </tr>
              ))}
              {physicalRooms.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Todavía no hay habitaciones físicas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
