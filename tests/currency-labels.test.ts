import { CURRENCIES, STATIC_COP_PER_UNIT } from "@/lib/format";
import {
  CURRENCY_LABELS,
  CURRENCY_OPTIONS,
  compactRate,
  currencyOptionLabel,
} from "@/lib/currency-labels";

describe("compactRate", () => {
  it("usa dos decimales para tasas menores a 10", () => {
    expect(compactRate(3.92)).toBe("3,92");
  });

  it("redondea sin decimales las tasas altas", () => {
    expect(compactRate(4200)).toBe("4.200");
    expect(compactRate(10)).toBe("10");
  });
});

describe("currencyOptionLabel", () => {
  it("COP no muestra tasa: es la moneda base", () => {
    expect(currencyOptionLabel("COP", STATIC_COP_PER_UNIT)).toBe("COP $");
  });

  it("agrega la tasa COP por unidad de la tabla recibida", () => {
    const rates = { ...STATIC_COP_PER_UNIT, USD: 4200, EUR: 4.55 };
    expect(currencyOptionLabel("USD", rates)).toBe("USD $ — 4.200");
    expect(currencyOptionLabel("EUR", rates)).toBe("EUR € — 4,55");
  });
});

describe("CURRENCY_OPTIONS y CURRENCY_LABELS", () => {
  it("expone todas las monedas en el orden canónico, COP primero", () => {
    expect(CURRENCY_OPTIONS).toEqual(CURRENCIES);
    expect(CURRENCY_OPTIONS[0]).toBe("COP");
  });

  it("tiene etiqueta para cada moneda", () => {
    for (const c of CURRENCY_OPTIONS) {
      expect(CURRENCY_LABELS[c]).toBeTruthy();
    }
  });
});
