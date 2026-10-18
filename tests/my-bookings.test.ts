import {
  canCancelBooking,
  isVisibleMyBooking,
  localIsoDate,
  myBookingBadgeKey,
  visibleMyBookings,
} from "@/lib/my-bookings";

describe("localIsoDate", () => {
  it("usa la fecha local aunque esté cerca de la medianoche", () => {
    expect(localIsoDate(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
    expect(localIsoDate(new Date(2026, 0, 6, 0, 30))).toBe("2026-01-06");
  });
});

describe("isVisibleMyBooking", () => {
  it("sigue visible el día de check-out", () => {
    expect(
      isVisibleMyBooking({ check_out: "2026-10-17" }, "2026-10-17")
    ).toBe(true);
  });

  it("desaparece al día siguiente del check-out", () => {
    expect(
      isVisibleMyBooking({ check_out: "2026-10-17" }, "2026-10-18")
    ).toBe(false);
  });

  it("una reserva futura siempre es visible", () => {
    expect(
      isVisibleMyBooking({ check_out: "2026-12-01" }, "2026-10-17")
    ).toBe(true);
  });

  it("acepta el datetime ISO que devuelve la API", () => {
    expect(
      isVisibleMyBooking(
        { check_out: "2026-10-17T00:00:00.000Z" },
        "2026-10-17"
      )
    ).toBe(true);
    expect(
      isVisibleMyBooking(
        { check_out: "2026-10-16T00:00:00.000Z" },
        "2026-10-17"
      )
    ).toBe(false);
  });

  it("oculta una reserva cancelada aunque su salida sea futura", () => {
    expect(
      isVisibleMyBooking(
        { check_out: "2026-12-01", status: "cancelled" },
        "2026-10-17"
      )
    ).toBe(false);
  });
});

describe("canCancelBooking", () => {
  const future = {
    status: "pending" as const,
    payment_status: "PENDING" as const,
    booked_by_user_id: "user-1",
    check_in: "2026-10-18T00:00:00.000Z",
  };

  it("el dueño puede cancelar antes del check-in", () => {
    expect(canCancelBooking(future, "user-1", "2026-10-17")).toBe(true);
    expect(
      canCancelBooking(
        { ...future, status: "confirmed", payment_status: "PAID" },
        "user-1",
        "2026-10-17"
      )
    ).toBe(true);
  });

  it("permite cancelar el mismo día del check-in", () => {
    expect(canCancelBooking(future, "user-1", "2026-10-18")).toBe(true);
  });

  it("no permite cancelar después del check-in", () => {
    expect(canCancelBooking(future, "user-1", "2026-10-19")).toBe(false);
  });

  it("exige ser el dueño exacto y tener sesión", () => {
    expect(canCancelBooking(future, "user-2", "2026-10-17")).toBe(false);
    expect(canCancelBooking(future, null, "2026-10-17")).toBe(false);
    expect(
      canCancelBooking(
        { ...future, booked_by_user_id: null },
        "user-1",
        "2026-10-17"
      )
    ).toBe(false);
  });

  it("excluye reservas canceladas o de otro estado", () => {
    expect(
      canCancelBooking(
        { ...future, status: "cancelled" },
        "user-1",
        "2026-10-17"
      )
    ).toBe(false);
  });
});

describe("visibleMyBookings", () => {
  it("filtra vencidas y canceladas sin tocar las vigentes", () => {
    const list = [
      { check_out: "2026-10-15" },
      { check_out: "2026-10-17" },
      { check_out: "2026-11-01", status: "confirmed" as const },
      { check_out: "2026-11-01", status: "cancelled" as const },
    ];
    expect(visibleMyBookings(list, "2026-10-17")).toEqual([
      { check_out: "2026-10-17" },
      { check_out: "2026-11-01", status: "confirmed" },
    ]);
  });
});

describe("myBookingBadgeKey", () => {
  it("cancelada gana sobre pagada", () => {
    expect(
      myBookingBadgeKey({ status: "cancelled", payment_status: "PAID" })
    ).toBe("cancelled");
  });

  it("pagada gana sobre confirmed y pending", () => {
    expect(
      myBookingBadgeKey({ status: "confirmed", payment_status: "PAID" })
    ).toBe("paid");
    expect(
      myBookingBadgeKey({ status: "pending", payment_status: "PAID" })
    ).toBe("paid");
  });

  it("sin pago conserva el estado de la reserva", () => {
    expect(
      myBookingBadgeKey({ status: "confirmed", payment_status: "PENDING" })
    ).toBe("confirmed");
    expect(
      myBookingBadgeKey({ status: "pending", payment_status: "PENDING" })
    ).toBe("pending");
  });
});
