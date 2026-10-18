import { buildHealthTargets, healthUrl } from "@/lib/warmup-targets";

describe("healthUrl", () => {
  it("recorta /v1 y barras finales", () => {
    expect(healthUrl("https://x.onrender.com/v1")).toBe(
      "https://x.onrender.com/health"
    );
    expect(healthUrl("https://x.onrender.com/v1/")).toBe(
      "https://x.onrender.com/health"
    );
    expect(healthUrl("http://localhost:3001/")).toBe(
      "http://localhost:3001/health"
    );
  });
});

describe("buildHealthTargets", () => {
  it("incluye los 11 servicios con defaults locales", () => {
    const targets = buildHealthTargets({});

    expect(targets).toHaveLength(11);
    expect(targets.map((target) => target.name)).toEqual([
      "property",
      "rate-availability",
      "user",
      "booking",
      "front-desk",
      "housekeeping",
      "billing",
      "channel-manager",
      "loyalty",
      "payment",
      "analytics",
    ]);
    expect(targets[0].url).toBe("http://localhost:3001/health");
    expect(targets[7].url).toBe("http://localhost:3008/health");
    expect(targets[10].url).toBe("http://localhost:3011/health");
  });

  it("usa las variables de entorno y normaliza la URL", () => {
    const targets = buildHealthTargets({
      NEXT_PUBLIC_PROPERTY_API_URL: "https://property.onrender.com/v1/",
      NEXT_PUBLIC_ANALYTICS_API_URL: "https://analytics.onrender.com/v1",
      CHANNEL_MANAGER_API_URL: "https://channel.onrender.com/v1",
    });

    expect(targets.find((target) => target.name === "property")?.url).toBe(
      "https://property.onrender.com/health"
    );
    expect(targets.find((target) => target.name === "analytics")?.url).toBe(
      "https://analytics.onrender.com/health"
    );
    expect(
      targets.find((target) => target.name === "channel-manager")?.url
    ).toBe("https://channel.onrender.com/health");
  });
});
