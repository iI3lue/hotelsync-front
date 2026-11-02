import { clientFetch, clientPost } from "@/lib/api-client";

jest.mock("@/lib/auth-client", () => ({
  authHeader: () => ({ Authorization: "Bearer test-token" }),
}));

function fakeResponse(status: number, body: unknown = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => null },
    json: async () => body,
    body: null,
  } as unknown as Response;
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("reintento ante 502/503/504 del borde", () => {
  it("reintenta un GET ante 502 y devuelve el segundo intento", async () => {
    fetchMock
      .mockResolvedValueOnce(fakeResponse(502, { error: "BadGateway" }))
      .mockResolvedValueOnce(fakeResponse(200, { hotels: [{ id: "h1" }] }));

    const promise = clientFetch("/api/property/hotels");
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(promise).resolves.toEqual({ hotels: [{ id: "h1" }] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("agota los 3 reintentos y lanza ApiError con el status real", async () => {
    fetchMock.mockResolvedValue(
      fakeResponse(502, {
        error: "BadGateway",
        message: "El servicio upstream no esta disponible",
      })
    );

    const promise = clientFetch("/api/property/hotels");
    const assertion = expect(promise).rejects.toMatchObject({
      name: "ApiError",
      status: 502,
      code: "BadGateway",
    });
    await jest.advanceTimersByTimeAsync(11_000);
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("no reintenta un POST ante 502 (evita duplicar la operacion)", async () => {
    fetchMock.mockResolvedValue(fakeResponse(502, { error: "BadGateway" }));

    await expect(clientPost("/api/booking/bookings", { roomId: "r1" })).rejects.toMatchObject(
      { status: 502 }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("no reintenta errores de negocio (400)", async () => {
    fetchMock.mockResolvedValue(fakeResponse(400, { error: "BadRequest", message: "faltan datos" }));

    await expect(clientFetch("/api/property/hotels")).rejects.toMatchObject({ status: 400 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reintenta un 503 y se recupera", async () => {
    fetchMock
      .mockResolvedValueOnce(fakeResponse(503))
      .mockResolvedValueOnce(fakeResponse(200, { ok: true }));

    const promise = clientFetch("/api/analytics/occupancy");
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
