import type { Hotel, RoomType } from "./api";

export type { Hotel, RoomType };

/**
 * Helpers puros (sin fetch ni APIs de servidor): seguros para importar
 * desde Client Components sin arrastrar el módulo servidor.
 */

export interface HotelFilters {
  city?: string;
  amenity?: string;
  minCapacity?: number;
  guests?: number;
}

/**
 * Estado de búsqueda compartido por la web pública. Se serializa en la URL
 * para que destino, fechas y huéspedes sobrevivan al navegar entre listado,
 * detalle, disponibilidad y reserva.
 */
export interface SearchState {
  city?: string;
  from?: string;
  to?: string;
  guests?: string;
  amenity?: string;
  minCap?: string;
  sort?: string;
  /** Selección del flujo de reserva (se conserva entre detalle, disponibilidad y reserva). */
  hotel?: string;
  room_type_id?: string;
  date?: string;
}

export const SEARCH_KEYS = [
  "city",
  "from",
  "to",
  "guests",
  "amenity",
  "minCap",
  "sort",
  "hotel",
  "room_type_id",
  "date",
] as const;

/** Query string del estado de búsqueda, con overrides y omisiones. */
export function searchQuery(
  state: SearchState = {},
  overrides: Partial<SearchState> = {},
  omit: (keyof SearchState)[] = []
): string {
  const merged: SearchState = { ...state, ...overrides };
  const params = new URLSearchParams();
  for (const key of SEARCH_KEYS) {
    if (omit.includes(key)) continue;
    const value = merged[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

/** Une un path con el estado de búsqueda persistido. */
export function withSearch(
  path: string,
  state: SearchState = {},
  overrides: Partial<SearchState> = {},
  omit: (keyof SearchState)[] = []
): string {
  const qs = searchQuery(state, overrides, omit);
  return qs ? `${path}?${qs}` : path;
}

function isoToLocalDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  return Number.isNaN(d.getTime()) ? null : d;
}

function localDateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Noches ocupadas por la estancia: desde `from` inclusive hasta `to` exclusive
 * (la fecha de check-out no se ocupa). Vacío si el rango es inválido.
 */
export function stayNights(from?: string, to?: string): string[] {
  if (!from || !to) return [];
  const start = isoToLocalDate(from);
  const end = isoToLocalDate(to);
  if (!start || !end || end.getTime() <= start.getTime()) return [];
  const out: string[] = [];
  const cursor = new Date(start);
  while (cursor.getTime() < end.getTime()) {
    out.push(localDateToIso(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Consulta de stock: (roomTypeId, isoDate) => disponibles, o undefined si no hay datos. */
export type StockLookup = (roomTypeId: string, iso: string) => number | undefined;

export interface StayInfo {
  from?: string;
  to?: string;
  guests?: number;
  stock?: StockLookup;
}

/**
 * available  = hay datos y todas las noches tienen stock
 * unavailable = hay datos y al menos una noche está en cero
 * unknown    = no hay datos de inventario para juzgar (no se excluye)
 */
export type StayAvailability = "available" | "unavailable" | "unknown";

function roomTypeStayAvailability(
  roomType: RoomType,
  nights: string[],
  stock: StockLookup
): StayAvailability {
  let sawData = false;
  let hasZero = false;
  for (const iso of nights) {
    const count = stock(roomType.room_type_id, iso);
    if (count === undefined) return "unknown";
    sawData = true;
    if (count <= 0) hasZero = true;
  }
  if (!sawData) return "unknown";
  return hasZero ? "unavailable" : "available";
}

export function hotelStayAvailability(
  hotel: Hotel,
  nights: string[],
  stock?: StockLookup
): StayAvailability {
  const roomTypes = hotel.roomTypes ?? [];
  if (nights.length === 0 || !stock || roomTypes.length === 0) return "unknown";
  let unknown = false;
  for (const roomType of roomTypes) {
    const status = roomTypeStayAvailability(roomType, nights, stock);
    if (status === "available") return "available";
    if (status === "unknown") unknown = true;
  }
  return unknown ? "unknown" : "unavailable";
}

/**
 * Clasifica hoteles por disponibilidad de la estancia.
 * Solo se excluyen los hoteles con evidencia real de agotado; los que no tienen
 * datos de inventario se conservan para no dejar la búsqueda vacía.
 */
export function applyStayAvailability(
  hotels: Hotel[],
  stay: StayInfo
): { visible: Hotel[]; status: Map<string, StayAvailability> } {
  const nights = stayNights(stay.from, stay.to);
  const status = new Map<string, StayAvailability>();
  const order: Record<StayAvailability, number> = {
    available: 0,
    unknown: 1,
    unavailable: 2,
  };

  const judged = hotels.map((hotel) => {
    const availability = hotelStayAvailability(hotel, nights, stay.stock);
    status.set(hotel.hotel_id, availability);
    return { hotel, availability };
  });

  const visible = judged
    .filter((entry) => entry.availability !== "unavailable")
    .sort((a, b) => order[a.availability] - order[b.availability])
    .map((entry) => entry.hotel);

  return { visible, status };
}

/**
 * Normaliza para búsqueda: minúsculas + sin diacríticos. Así "Medellín"
 * matchea "medellin" y "Bogotá" matchea "bogota".
 */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur: number[] = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * Tolerancia a typos por token: tokens cortos solo exacto/prefijo,
 * el resto admite distancia de edición proporcional a su largo.
 */
function fuzzyThreshold(token: string): number {
  if (token.length < 4) return 0;
  return Math.max(1, Math.floor(token.length / 4));
}

function hotelHaystack(hotel: Hotel): string {
  return `${hotel.name} ${hotel.city} ${hotel.country}`;
}

/**
 * Puntaje de relevancia de una query sobre un texto: 0 = no matchea.
 * Frase exacta > token exacto > prefijo > typo (a mayor puntaje, mejor).
 * Todos los tokens de la query tienen que matchear (semántica AND).
 */
export function matchScore(haystack: string, query: string): number {
  const q = normalizeText(query);
  if (!q) return 0;
  const h = normalizeText(haystack);
  if (!h) return 0;
  if (h.includes(q)) return 100 + q.length;
  const hTokens = h.split(" ");
  let score = 0;
  for (const qToken of q.split(" ")) {
    let best = 0;
    for (const hToken of hTokens) {
      if (hToken === qToken) {
        best = 30;
        break;
      }
      if (hToken.startsWith(qToken) && qToken.length >= 2) {
        best = Math.max(best, 20);
      } else {
        const threshold = fuzzyThreshold(qToken);
        if (
          threshold > 0 &&
          levenshtein(qToken, hToken) <= threshold
        ) {
          best = Math.max(best, 10);
        }
      }
    }
    if (best === 0) return 0;
    score += best;
  }
  return score;
}

/**
 * Ordena por relevancia cuando hay query (el sort "Relevancia" de /buscar).
 * Sin query devuelve el mismo orden.
 */
export function rankHotelsByRelevance<T extends Hotel>(
  hotels: T[],
  query?: string
): T[] {
  const q = query?.trim();
  if (!q) return hotels;
  return [...hotels]
    .map((hotel) => ({ hotel, score: matchScore(hotelHaystack(hotel), q) }))
    .sort((a, b) => b.score - a.score)
    .map(({ hotel }) => hotel);
}

/**
 * Sugiere el hotel más cercano a una query sin resultados
 * ("¿Quisiste decir…?"). Null si ni siquiera hay un cercano razonable.
 */
export function suggestHotel(hotels: Hotel[], query: string): Hotel | null {
  const qTokens = normalizeText(query).split(" ").filter(Boolean);
  if (qTokens.length === 0 || hotels.length === 0) return null;
  let best: Hotel | null = null;
  let bestCost = Infinity;
  for (const hotel of hotels) {
    const hTokens = normalizeText(`${hotel.name} ${hotel.city}`).split(" ");
    let cost = 0;
    for (const qToken of qTokens) {
      let min = Infinity;
      for (const hToken of hTokens) {
        const d = levenshtein(qToken, hToken);
        if (d < min) min = d;
      }
      cost += min;
    }
    if (cost < bestCost) {
      bestCost = cost;
      best = hotel;
    }
  }
  const budget = Math.max(2, Math.floor(normalizeText(query).length / 4));
  return best !== null && bestCost <= budget ? best : null;
}
/**
 * Filtro unificado: acepta el objeto de la web pública
 * ({city, amenity, minCapacity}) o el query simple del admin (string).
 * El texto matchea tolerante a tildes y typos (matchScore).
 */
export function filterHotels(hotels: Hotel[], filters?: HotelFilters | string): Hotel[] {
  if (typeof filters === "string") {
    const q = filters.trim();
    if (!q) return hotels;
    return hotels.filter(
      (hotel) => matchScore(hotelHaystack(hotel), q) > 0
    );
  }
  const city = filters?.city?.trim();
  const amenity = filters?.amenity ? normalizeText(filters.amenity) : "";
  const minCapacity = filters?.minCapacity;
  const guests = filters?.guests;
  const requiredCapacity =
    minCapacity && guests ? Math.max(minCapacity, guests) : minCapacity ?? guests;
  if (!city && !amenity && !requiredCapacity) return hotels;
  return hotels.filter((hotel) => {
    if (city && matchScore(hotelHaystack(hotel), city) === 0) {
      return false;
    }
    const roomTypes = hotel.roomTypes ?? [];
    if (amenity && !roomTypes.some((r) => (r.amenities ?? []).some((a) => normalizeText(a).includes(amenity)))) {
      return false;
    }
    if (requiredCapacity && !roomTypes.some((r) => r.capacity >= requiredCapacity)) {
      return false;
    }
    return true;
  });
}

const priceFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number | string): string {
  return priceFormatter.format(Number(value));
}

export function formatDate(dateIso: string): string {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${dateIso}T12:00:00`));
  } catch {
    return dateIso;
  }
}

export function minRate(hotel: Hotel): number | null {
  const rates = (hotel.roomTypes ?? []).map((r) => Number(r.base_rate));
  if (rates.length === 0) return null;
  return Math.min(...rates);
}
