"use client";

import { useCurrency } from "@/components/CurrencyProvider";

/**
 * Monto en COP formateado en la moneda elegida (solo visual).
 * Frontera cliente para usar dentro de Server Components.
 */
export default function Money({
  amountCOP,
  className,
}: {
  amountCOP: number | string;
  className?: string;
}) {
  const { formatMoney } = useCurrency();
  return <span className={className}>{formatMoney(amountCOP)}</span>;
}
