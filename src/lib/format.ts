import type { Hotel } from "./api";

/**
 * Helpers puros (sin fetch ni APIs de servidor): seguros para importar
 * desde Client Components sin arrastrar el módulo servidor.
 */

export interface HotelFilters {
  city?: string;
  amenity?: string;
  minCapacity?: number;
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
  if (!city && !amenity && !minCapacity) return hotels;
  return hotels.filter((hotel) => {
    if (city && matchScore(hotelHaystack(hotel), city) === 0) {
      return false;
    }
    const roomTypes = hotel.roomTypes ?? [];
    if (amenity && !roomTypes.some((r) => (r.amenities ?? []).some((a) => normalizeText(a).includes(amenity)))) {
      return false;
    }
    if (minCapacity && !roomTypes.some((r) => r.capacity >= minCapacity)) {
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
