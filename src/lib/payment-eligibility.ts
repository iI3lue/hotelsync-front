import type { Booking } from "./api";

/**
 * ¿Se puede pagar esta reserva en línea ahora?
 *
 * Dos condiciones, y las dos importan:
 *
 * 1. Vínculo real de cuenta: `booked_by_user_id === currentUserId`. Es la
 *    MISMA regla que aplica payment-service para autorizar al huésped
 *    (`resolveBookingForPayer`). "Mis reservas" también lista reservas
 *    hechas a nombre del email verificado pero creadas sin sesión: ésas
 *    NO son cobrables por esta cuenta (el pago daría 403).
 * 2. No cancelada y no pagada. Cubre tanto "pagar en el hotel" (RECEPTION)
 *    como un cobro ONLINE que quedó pendiente o falló; payment-service es
 *    idempotente por reserva.
 */
export function canPayOnline(
  booking: Pick<Booking, "status" | "payment_status" | "booked_by_user_id">,
  currentUserId: string | null
): boolean {
  return (
    currentUserId !== null &&
    booking.booked_by_user_id === currentUserId &&
    booking.status !== "cancelled" &&
    booking.payment_status !== "PAID"
  );
}
