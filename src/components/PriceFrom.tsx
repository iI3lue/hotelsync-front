import { formatPrice } from "@/lib/format";

/**
 * Precio "desde" compartido: mismo bloque en cards y detalle.
 * `rate` en null no renderiza nada (hotel sin tarifas).
 */
export default function PriceFrom({
  rate,
  size = "md",
  tone = "default",
}: {
  rate: number | null;
  size?: "md" | "lg";
  tone?: "default" | "inverse";
}) {
  if (rate === null) return null;
  const muted = tone === "inverse" ? "text-white/60" : "text-brand-navy/55 dark:text-white/50";
  return (
    <p className="leading-tight">
      <span className={`block text-eyebrow uppercase ${muted}`}>Desde</span>
      <span className={`tabular-nums ${size === "lg" ? "font-display text-[2.25rem]" : "text-[1.25rem] font-normal"}`}>
        {formatPrice(rate)}
      </span>
      <span className={`ml-1.5 text-[0.8125rem] ${muted}`}>/ noche</span>
    </p>
  );
}
