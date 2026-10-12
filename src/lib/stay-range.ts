/** Noches de una estadía en ISO (check-in incluido, check-out excluido). */
export function stayNights(checkInIso: string, checkOutIso: string): string[] {
  const nights: string[] = [];
  const start = new Date(`${checkInIso}T12:00:00`);
  const end = new Date(`${checkOutIso}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return nights;
  const d = new Date(start);
  while (d < end) {
    nights.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return nights;
}

/**
 * Primera noche sin stock (`stock[iso] <= 0` o ausente), o null si la
 * estadía completa tiene disponibilidad.
 */
export function firstNightWithoutStock(
  nights: string[],
  stock: Record<string, number>
): string | null {
  for (const iso of nights) {
    if ((stock[iso] ?? 0) <= 0) return iso;
  }
  return null;
}
