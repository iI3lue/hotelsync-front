import { fetchRoomTypes } from "@/lib/api";
import RoomTypeForm from "@/components/RoomTypeForm";

export default async function RoomTypesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roomTypes = await fetchRoomTypes(id);

  return (
    <div>
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
    </div>
  );
}
