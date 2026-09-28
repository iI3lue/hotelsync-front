import { formatPrice } from "@/lib/format";

/**
 * Precio "desde" compartido: mismo bloque en cards y detalle.
 * `rate` en null no renderiza nada (hotel sin tarifas).
 */
export default function PriceFrom({
  rate,
  size = "md",
}: {
  rate: number | null;
  size?: "md" | "lg";
}) {
  if (rate === null) return null;
  return (
    <p
      className={`font-bold text-blue-600 tabular-nums dark:text-blue-400 ${
        size === "lg" ? "mb-6 text-xl" : "mb-1 text-lg"
      }`}
    >
      {formatPrice(rate)}{" "}
      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
        / noche desde
      </span>
    </p>
  );
}
