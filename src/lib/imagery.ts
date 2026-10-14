/**
 * Fotografía editorial de respaldo.
 *
 * Cuando un hotel o habitación no tiene `image_url` cargada, se elige una
 * foto de forma determinística (mismo hotel → misma foto en cada visita),
 * para que el sitio nunca muestre bloques vacíos ni iniciales.
 * Reemplazar estos IDs por fotografía propia de la cadena cuando exista.
 */
const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const HOTEL_POOL = [
  "photo-1566073771259-6a8506099945",
  "photo-1542314831-068cd1dbfeeb",
  "photo-1520250497591-112f2f40a3f4",
  "photo-1551882547-ff40c63fe5fa",
  "photo-1571896349842-33c89424de2d",
  "photo-1564501049412-61c2a3083791",
];

const ROOM_POOL = [
  "photo-1582719478250-c89cae4dc85b",
  "photo-1590490360182-c33d57733427",
  "photo-1566665797739-1674de7a421a",
  "photo-1596394516093-501ba68a0ba6",
  "photo-1611892440504-42a792e24d32",
  "photo-1618773928121-c32242e63f39",
];

/** Escenas de la casa: hero, gastronomía, bienestar, encuentros. */
export const SCENES = {
  hero: U("photo-1540541338287-41700207dee6", 2400),
  lobby: U("photo-1445019980597-93fa8acb246c"),
  dining: U("photo-1414235077428-338989a2e8c0"),
  wellness: U("photo-1544161515-4ab6ce6db874"),
  bar: U("photo-1470337458703-46ad1756a187"),
  gatherings: U("photo-1519167758481-83f550bb49b3"),
  pool: U("photo-1584132967334-10e028bd69f7"),
} as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function hotelImage(hotel: { hotel_id: string; image_url?: string | null }, w = 1600): string {
  return hotel.image_url || U(HOTEL_POOL[hash(hotel.hotel_id) % HOTEL_POOL.length], w);
}

/** Foto de habitación: respeta `image_url`; si no, elige por nombre/tipo. */
export function roomImage(room: { room_type_id: string; name: string; image_url?: string | null }, w = 1200): string {
  if (room.image_url) return room.image_url;
  const n = room.name.toLowerCase();
  if (/(suite|deluxe|king)/.test(n)) return U(ROOM_POOL[0], w);
  if (/(mar|ocean|caribe|beach|playa)/.test(n)) return U(ROOM_POOL[2], w);
  if (/(chalet|alpin|cava|wine|viñedo|lago)/.test(n)) return U(ROOM_POOL[3], w);
  return U(ROOM_POOL[hash(room.room_type_id) % ROOM_POOL.length], w);
}
