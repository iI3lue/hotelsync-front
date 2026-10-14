import type { Hotel } from "./api";
import { normalizeText } from "./format";
import { hotelImage } from "./imagery";

/**
 * Una frase propia por ciudad (al estilo de las colecciones boutique):
 * cuenta qué se viene a buscar ahí. Ciudades nuevas usan la genérica.
 */
const CITY_LINES: Record<string, string> = {
  cartagena: "Murallas, balcones con buganvilias y el Caribe a una cuadra.",
  medellin: "Clima de primavera todo el año y una ciudad que no deja de inventarse.",
  bogota: "Altura, cafés de especialidad y museos para perderse una tarde entera.",
  "buenos aires": "Cafés de esquina, tango a deshoras y cenas que empiezan tarde.",
  "mar del plata": "Rambla, viento salado y el Atlántico como paisaje de ventana.",
  "san carlos de bariloche": "Lagos glaciares, bosque andino y chocolate después de la nieve.",
  bariloche: "Lagos glaciares, bosque andino y chocolate después de la nieve.",
  mendoza: "Viñedos al pie de los Andes y atardeceres que piden un Malbec.",
};

export function cityLine(city: string): string {
  return CITY_LINES[normalizeText(city)] ?? "Un barrio para conocer caminando y una casa a la que volver.";
}

export interface Destination {
  city: string;
  country: string;
  hotels: number;
  image: string;
  line: string;
}

/** Agrupa hoteles por ciudad, ordenados por país (como un directorio). */
export function destinationsFrom(hotels: Hotel[]): Destination[] {
  const map = new Map<string, Destination>();
  for (const h of hotels) {
    const key = normalizeText(h.city);
    const cur = map.get(key);
    if (cur) cur.hotels += 1;
    else map.set(key, { city: h.city, country: h.country, hotels: 1, image: hotelImage(h, 1000), line: cityLine(h.city) });
  }
  return [...map.values()].sort((a, b) => a.country.localeCompare(b.country, "es") || a.city.localeCompare(b.city, "es"));
}
