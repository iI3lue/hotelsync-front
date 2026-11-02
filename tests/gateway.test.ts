import {
  isGatewayServiceEnabled,
  parseGatewayServices,
  resolveClientIp,
} from "../src/lib/gateway";

describe("parseGatewayServices", () => {
  it("returns an empty set for empty or missing values", () => {
    expect(parseGatewayServices(undefined).size).toBe(0);
    expect(parseGatewayServices("").size).toBe(0);
    expect(parseGatewayServices("   ").size).toBe(0);
  });

  it("trims entries and ignores empty ones", () => {
    expect([...parseGatewayServices(" property , booking ,, ")]).toEqual([
      "property",
      "booking",
    ]);
  });
});

describe("isGatewayServiceEnabled", () => {
  it("matches only listed services", () => {
    const raw = "property";

    expect(isGatewayServiceEnabled(raw, "property")).toBe(true);
    expect(isGatewayServiceEnabled(raw, "booking")).toBe(false);
    expect(isGatewayServiceEnabled("", "property")).toBe(false);
  });
});

describe("resolveClientIp", () => {
  it("takes the first hop from x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.9, 10.0.0.1",
    });

    expect(resolveClientIp(headers)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.7" });

    expect(resolveClientIp(headers)).toBe("198.51.100.7");
  });

  it("returns an empty string when no header is present", () => {
    expect(resolveClientIp(new Headers())).toBe("");
  });
});
