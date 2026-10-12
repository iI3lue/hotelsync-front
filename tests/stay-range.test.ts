import { firstNightWithoutStock, stayNights } from "@/lib/stay-range";

describe("stayNights", () => {
  it("enumera check-in incluido y check-out excluido", () => {
    expect(stayNights("2026-11-20", "2026-11-22")).toEqual([
      "2026-11-20",
      "2026-11-21",
    ]);
  });

  it("una noche devuelve un solo día", () => {
    expect(stayNights("2026-11-20", "2026-11-21")).toEqual(["2026-11-20"]);
  });

  it("rango invertido o inválido devuelve vacío", () => {
    expect(stayNights("2026-11-22", "2026-11-20")).toEqual([]);
    expect(stayNights("no-fecha", "2026-11-20")).toEqual([]);
  });
});

describe("firstNightWithoutStock", () => {
  it("null cuando todas las noches tienen stock", () => {
    expect(
      firstNightWithoutStock(["2026-11-20", "2026-11-21"], {
        "2026-11-20": 5,
        "2026-11-21": 1,
      })
    ).toBeNull();
  });

  it("devuelve la primera noche sin stock", () => {
    expect(
      firstNightWithoutStock(["2026-11-20", "2026-11-21", "2026-11-22"], {
        "2026-11-20": 5,
        "2026-11-21": 0,
        "2026-11-22": 0,
      })
    ).toBe("2026-11-21");
  });

  it("día ausente del mapa cuenta como sin stock", () => {
    expect(firstNightWithoutStock(["2026-11-20"], {})).toBe("2026-11-20");
  });
});
