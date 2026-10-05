import { convertFromCOP, formatMoney, STATIC_COP_PER_UNIT } from "@/lib/format";
import { fallbackPayload, parseErApiResponse } from "@/lib/rates";

const ER_API_SAMPLE = {
  result: "success",
  base_code: "COP",
  time_last_update_utc: "Sun, 04 Oct 2026 00:00:00 +0000",
  rates: {
    USD: 0.00025,
    EUR: 0.00022,
    MXN: 0.0045,
  },
};

describe("parseErApiResponse", () => {
  it("invierte unidades-por-COP a COP-por-unidad", () => {
    const { rates, updatedUtc } = parseErApiResponse(ER_API_SAMPLE);
    expect(rates.USD).toBeCloseTo(4000, 0);
    expect(rates.EUR).toBeCloseTo(4545.45, 0);
    expect(updatedUtc).toBe("Sun, 04 Oct 2026 00:00:00 +0000");
  });

  it("conserva el fallback para símbolos ausentes", () => {
    const { rates } = parseErApiResponse(ER_API_SAMPLE);
    expect(rates.BRL).toBe(STATIC_COP_PER_UNIT.BRL);
    expect(rates.COP).toBe(1);
  });

  it("rechaza respuestas de error o de otra base", () => {
    expect(() =>
      parseErApiResponse({ result: "error", base_code: "COP", rates: {} })
    ).toThrow();
    expect(() =>
      parseErApiResponse({ result: "success", base_code: "USD", rates: {} })
    ).toThrow();
    expect(() => parseErApiResponse(null)).toThrow();
  });
});

describe("fallbackPayload", () => {
  it("marca live en false con tasas estáticas", () => {
    const p = fallbackPayload();
    expect(p.base).toBe("COP");
    expect(p.live).toBe(false);
    expect(p.updated_utc).toBeNull();
    expect(p.rates.USD).toBe(STATIC_COP_PER_UNIT.USD);
  });
});

describe("conversión con tasas vivas", () => {
  const live = { ...STATIC_COP_PER_UNIT, USD: 4200 };

  it("convierte el total en COP una sola vez con la tasa viva", () => {
    expect(convertFromCOP(8400, "USD", live)).toBe(2);
  });

  it("formatea con la tasa viva", () => {
    expect(formatMoney(8400, "USD", live)).toBe("$2.00");
  });

  it("sin tasas usa el fallback estático", () => {
    expect(convertFromCOP(8200, "USD")).toBe(2);
  });
});
