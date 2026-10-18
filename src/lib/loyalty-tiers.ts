/** Constantes de niveles de fidelización compartidas por la UI. */

export const TIER_LABELS: Record<string, string> = {
  silver: "Plata",
  gold: "Oro",
  platinum: "Platino",
};

export const TIER_COLORS: Record<string, string> = {
  silver: "border-brand-navy/25 text-brand-navy/70 dark:border-white/30 dark:text-white/70",
  gold: "border-brand-gold text-brand-gold",
  platinum: "border-brand-navy bg-brand-navy text-white dark:border-white dark:bg-white dark:text-brand-navy",
};

/** Multiplicadores de acreditación por nivel (deben coincidir con loyalty-service). */
export const TIER_MULTIPLIERS: Record<string, number> = {
  silver: 1,
  gold: 1.25,
  platinum: 1.5,
};

/** Color de acento (barras de progreso, toasts) por nivel. */
export const TIER_PROGRESS: Record<string, string> = {
  silver: "bg-brand-navy/40 dark:bg-white/50",
  gold: "bg-brand-gold",
  platinum: "bg-brand-navy dark:bg-white",
};

export function tierLabel(tier: string | null | undefined): string {
  if (!tier) return "";
  return TIER_LABELS[tier] ?? tier;
}

/** Puntos estimados de un pago para un nivel dado (misma fórmula que el servicio). */
export function projectedPoints(amount: number, tier: string | null | undefined): number {
  const multiplier = TIER_MULTIPLIERS[tier ?? "silver"] ?? 1;
  return Math.floor(amount * multiplier);
}
