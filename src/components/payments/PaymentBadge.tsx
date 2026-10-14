/**
 * Estado de cobro de una reserva (independiente de pending/confirmed).
 * Se usa en recepción, en la tabla de reservas y en "Mis reservas".
 */
export default function PaymentBadge({
  status,
  preference,
  size = "md",
}: {
  status?: "PENDING" | "PAID" | string | null;
  preference?: "ONLINE" | "RECEPTION" | string | null;
  size?: "sm" | "md";
}) {
  const paid = status === "PAID";
  const label = paid
    ? "Pagada"
    : preference === "RECEPTION"
      ? "Paga en el hotel"
      : "Pago pendiente";
  const pad = size === "sm" ? "px-2 py-0.5 text-[0.625rem]" : "px-2.5 py-1 text-[0.6875rem]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium uppercase tracking-[0.12em] ${pad} ${
        paid
          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
          : "bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
      }`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-emerald-600" : "bg-amber-500"}`} />
      {label}
    </span>
  );
}
