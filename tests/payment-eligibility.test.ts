import { canPayOnline } from "@/lib/payment-eligibility";

const ME = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

describe("canPayOnline", () => {
  it("una reserva cancelada nunca se puede pagar", () => {
    expect(
      canPayOnline({ status: "cancelled", payment_status: "PENDING", booked_by_user_id: ME }, ME)
    ).toBe(false);
  });

  it("una reserva ya pagada no se vuelve a pagar", () => {
    expect(
      canPayOnline({ status: "confirmed", payment_status: "PAID", booked_by_user_id: ME }, ME)
    ).toBe(false);
    expect(
      canPayOnline({ status: "pending", payment_status: "PAID", booked_by_user_id: ME }, ME)
    ).toBe(false);
  });

  it("pagar en el hotel (RECEPTION) queda pagadero en línea", () => {
    expect(
      canPayOnline({ status: "confirmed", payment_status: "PENDING", booked_by_user_id: ME }, ME)
    ).toBe(true);
  });

  it("un cobro online pendiente o fallido queda pagadero", () => {
    expect(
      canPayOnline({ status: "pending", payment_status: "PENDING", booked_by_user_id: ME }, ME)
    ).toBe(true);
    expect(
      canPayOnline({ status: "confirmed", payment_status: "PENDING", booked_by_user_id: ME }, ME)
    ).toBe(true);
  });

  it("sin payment_status definido se asume pendiente de pago", () => {
    expect(
      canPayOnline({ status: "confirmed", payment_status: undefined, booked_by_user_id: ME }, ME)
    ).toBe(true);
  });

  it("una reserva de otra cuenta no se puede pagar (payment-service daría 403)", () => {
    expect(
      canPayOnline({ status: "confirmed", payment_status: "PENDING", booked_by_user_id: OTHER }, ME)
    ).toBe(false);
  });

  it("una reserva anónima (sin dueño) no se puede pagar", () => {
    expect(
      canPayOnline({ status: "confirmed", payment_status: "PENDING", booked_by_user_id: null }, ME)
    ).toBe(false);
  });

  it("sin sesión no se puede pagar nada", () => {
    expect(
      canPayOnline({ status: "confirmed", payment_status: "PENDING", booked_by_user_id: ME }, null)
    ).toBe(false);
  });
});
