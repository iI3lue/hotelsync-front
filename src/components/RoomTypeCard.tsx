import type { RoomType, SearchState } from "@/lib/api";
import { withSearch } from "@/lib/api";
import Money from "@/components/Money";

interface RoomTypeCardProps {
  roomType: RoomType;
  search?: SearchState;
}

export default function RoomTypeCard({ roomType, search }: RoomTypeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-2">{roomType.name}</h3>
      <p className="text-gray-600 mb-2 dark:text-gray-300">
        Capacidad: {roomType.capacity}{" "}
        {roomType.capacity === 1 ? "huésped" : "huéspedes"}
      </p>
      <p className="text-blue-600 font-bold text-lg mb-3 tabular-nums dark:text-blue-400">
        <Money amountCOP={roomType.base_rate} /> / noche
      </p>
      {roomType.amenities && roomType.amenities.length > 0 && (
        <ul className="mb-4 flex flex-wrap gap-2">
          {roomType.amenities.map((amenity) => (
            <li
              key={amenity}
              className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded dark:bg-gray-700 dark:text-gray-200"
            >
              {amenity.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      )}
      <a
        href={withSearch(
          `/hotels/${encodeURIComponent(roomType.hotel_id)}/availability`,
          search,
          { room_type_id: roomType.room_type_id, date: undefined }
        )}
        aria-label={`Ver disponibilidad de ${roomType.name}`}
        className="inline-block rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
      >
        Ver disponibilidad
      </a>
    </div>
  );
}
