import { fetchHotelById } from "@/lib/api";

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const hotel = await fetchHotelById(id);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{hotel.name}</h1>
      <div className="bg-white rounded-lg shadow p-6 mb-6 dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-300">
          {hotel.city}, {hotel.country}
        </p>
        <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">
          Zona horaria: {hotel.timezone}
        </p>
      </div>

      <div className="flex space-x-4 mb-6">
        <a
          href={`/admin/hotels/${id}/rooms`}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Gestionar tipos de habitación
        </a>
        <a
          href={`/admin/hotels/${id}/inventory`}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Gestionar inventario
        </a>
      </div>
    </div>
  );
}
