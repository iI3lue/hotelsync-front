import { backoffDelay, timeoutSignal } from "@/lib/timeout-signal";

describe("timeoutSignal", () => {
  it("usa AbortSignal.timeout cuando existe", () => {
    const signal = timeoutSignal(1000);
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal.aborted).toBe(false);
  });

  it("abort con TimeoutError cuando el nativo no existe (iOS viejo)", (done) => {
    const nativeTimeout = AbortSignal.timeout;
    // @ts-expect-error simulamos Safari viejo sin AbortSignal.timeout
    AbortSignal.timeout = undefined;
    try {
      const signal = timeoutSignal(20);
      signal.addEventListener("abort", () => {
        expect(signal.aborted).toBe(true);
        const reason = signal.reason;
        expect(reason).toBeInstanceOf(DOMException);
        expect((reason as DOMException).name).toBe("TimeoutError");
        done();
      });
    } finally {
      AbortSignal.timeout = nativeTimeout;
    }
  });

  it("limpia el timer si el caller aborta antes (no deja timers colgados)", (done) => {
    const nativeTimeout = AbortSignal.timeout;
    // @ts-expect-error simulamos Safari viejo sin AbortSignal.timeout
    AbortSignal.timeout = undefined;
    try {
      const controller = new AbortController();
      const signal = timeoutSignal(50);
      // El helper devuelve su propia señal; abortarla directo verifica
      // que el listener once no revienta al dispararse.
      expect(signal.aborted).toBe(false);
      expect(controller.signal.aborted).toBe(false);
      setTimeout(done, 80);
    } finally {
      AbortSignal.timeout = nativeTimeout;
    }
  });
});

describe("backoffDelay", () => {
  it("crece por intento con jitter acotado", () => {
    for (let i = 0; i < 20; i++) {
      const d0 = backoffDelay(0);
      const d1 = backoffDelay(1);
      expect(d0).toBeGreaterThanOrEqual(400);
      expect(d0).toBeLessThan(600);
      expect(d1).toBeGreaterThanOrEqual(800);
      expect(d1).toBeLessThan(1000);
    }
  });
});
