import type { Booking } from "./api";

/** Fecha local en formato `YYYY-MM-DD` (no UTC). */
export function localIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * `check_out` llega como DATE serializada (`2026-11-10T00:00:00.000Z`).
 * Se compara solo la parte de fecha para no correr el día por zona horaria.
 */
export function checkOutIsoDate(booking: Pick<Booking, "check_out">): string | null {
  return booking.check_out ? booking.check_out.slice(0, 10) : null;
}

/**
 * La reserva sigue en "Mis reservas" durante todo el día de salida y
 * desaparece al día siguiente. Las canceladas se ocultan de inmediato.
 */
export function isVisibleMyBooking(
  booking: Pick<Booking, "check_out"> & Partial<Pick<Booking, "status">>,
  today: string = localIsoDate()
): boolean {
  if (booking.status === "cancelled") return false;
  const checkOut = checkOutIsoDate(booking);
  return checkOut === null || checkOut >= today;
}

export function visibleMyBookings<
  T extends Pick<Booking, "check_out"> & Partial<Pick<Booking, "status">>
>(
  bookings: T[],
  today: string = localIsoDate()
): T[] {
  return bookings.filter((booking) => isVisibleMyBooking(booking, today));
}

export function isPaidBooking(
  booking: Pick<Booking, "payment_status">
): boolean {
  return booking.payment_status === "PAID";
}

/**
 * Reservas cuyo cobro online hay que confirmar contra payment-service al
 * cargar la lista: el evento `payment.completed` puede no haber llegado
 * todavía a booking, y el listado no debe mostrar "Pago pendiente" ni
 * "Pagar ahora" si el cobro ya se hizo.
 */
export function needsPaymentReconciliation(
  booking: Pick<Booking, "status" | "payment_status" | "payment_method_preference">
): boolean {
  if (booking.status === "cancelled") return false;
  if (booking.payment_status === "PAID" || booking.payment_status === "REFUNDED") {
    return false;
  }
  return booking.payment_method_preference !== "RECEPTION";
}

/** Aplica los estados de cobro confirmados por payment-service al listado. */
export function applyPaymentStatuses<
  T extends Pick<Booking, "booking_id" | "payment_status" | "paid_at">
>(bookings: T[], statuses: ReadonlyMap<string, "PAID">): T[] {
  if (statuses.size === 0) return bookings;
  return bookings.map((booking) => {
    if (!statuses.has(booking.booking_id)) return booking;
    return {
      ...booking,
      payment_status: "PAID" as const,
      paid_at: booking.paid_at ?? new Date().toISOString(),
    };
  });
}

/**
 * Sólo el dueño exacto (`booked_by_user_id`) puede cancelar desde la web,
 * antes del check-in y mientras la reserva siga pendiente o confirmada.
 * Las pagadas también se cancelan (el reembolso es simulado).
 */
export function canCancelBooking(
  booking: Pick<Booking, "status" | "payment_status" | "booked_by_user_id" | "check_in">,
  currentUserId: string | null,
  today: string = localIsoDate()
): boolean {
  if (currentUserId === null) return false;
  if (booking.booked_by_user_id !== currentUserId) return false;
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return false;
  }
  return booking.check_in.slice(0, 10) >= today;
}

/**
 * Clave de badge principal. Cancelada gana sobre pagada para no ocultar una
 * cancelación; pagada gana sobre pending/confirmed porque el cobro es el
 * estado que el huésped necesita ver.
 */
export function myBookingBadgeKey(
  booking: Pick<Booking, "status" | "payment_status">
): string {
  if (booking.status === "cancelled") return "cancelled";
  if (isPaidBooking(booking)) return "paid";
  return booking.status.toLowerCase();
}
