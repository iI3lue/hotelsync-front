import {
  applyStayAvailability,
  filterHotels,
  hotelStayAvailability,
  searchQuery,
  stayNights,
  withSearch,
  type Hotel,
  type RoomType,
  type StockLookup,
} from "@/lib/format";

function roomType(id: string, capacity: number, amenities: string[] = []): RoomType {
  return {
    room_type_id: id,
    hotel_id: "h1",
    name: `Room ${id}`,
    capacity,
    base_rate: 100,
    amenities,
  };
}

function hotel(
  id: string,
  roomTypes: RoomType[],
  overrides: Partial<Hotel> = {}
): Hotel {
  return {
    hotel_id: id,
    name: `Hotel ${id}`,
    city: "Bogota",
    country: "Colombia",
    timezone: "America/Bogota",
    roomTypes,
    cancellationPolicies: [],
    ...overrides,
  };
}

/** Stock fijo: (roomTypeId, iso) => disponibles; undefined = sin datos. */
function stock(map: Record<string, Record<string, number>>): StockLookup {
  return (roomTypeId, iso) => map[roomTypeId]?.[iso];
}

describe("stayNights", () => {
  it("devuelve las noches ocupadas, check-out exclusive", () => {
    expect(stayNights("2026-10-01", "2026-10-04")).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
  });

  it("una noche es un solo día", () => {
    expect(stayNights("2026-10-01", "2026-10-02")).toEqual(["2026-10-01"]);
  });

  it("devuelve vacío si falta alguna fecha", () => {
    expect(stayNights("2026-10-01", undefined)).toEqual([]);
    expect(stayNights(undefined, "2026-10-04")).toEqual([]);
    expect(stayNights("", "2026-10-04")).toEqual([]);
  });

  it("devuelve vacío si el rango es inválido o cero", () => {
    expect(stayNights("2026-10-04", "2026-10-01")).toEqual([]);
    expect(stayNights("2026-10-04", "2026-10-04")).toEqual([]);
    expect(stayNights("no-fecha", "2026-10-04")).toEqual([]);
  });
});

describe("searchQuery / withSearch", () => {
  it("omite claves vacías y arma el query", () => {
    expect(
      searchQuery({ city: "Bogota", from: "", to: "2026-10-02", guests: "2" })
    ).toBe("city=Bogota&to=2026-10-02&guests=2");
  });

  it("aplica overrides y elimina los que quedan undefined", () => {
    expect(
      searchQuery({ city: "Bogota", amenity: "wifi" }, { amenity: undefined })
    ).toBe("city=Bogota");
  });

  it("respetar las claves a omitir", () => {
    expect(
      searchQuery({ city: "Bogota", sort: "price-asc" }, {}, ["sort"])
    ).toBe("city=Bogota");
  });

  it("withSearch devuelve el path sin query cuando no hay estado", () => {
    expect(withSearch("/buscar", {})).toBe("/buscar");
  });

  it("withSearch une el path con el estado", () => {
    expect(withSearch("/buscar", { city: "Lima" })).toBe("/buscar?city=Lima");
  });
});

describe("filterHotels", () => {
  const h1 = hotel("h1", [roomType("r1", 2), roomType("r2", 4)], {
    city: "Bogota",
  });
  const h2 = hotel("h2", [roomType("r3", 2)], { city: "Cartagena" });

  it("filtra por ciudad", () => {
    const result = filterHotels([h1, h2], { city: "bogota" });
    expect(result.map((h) => h.hotel_id)).toEqual(["h1"]);
  });

  it("filtra por cantidad de huéspedes sobre la capacidad", () => {
    const result = filterHotels([h1, h2], { guests: 3 });
    expect(result.map((h) => h.hotel_id)).toEqual(["h1"]);
  });

  it("combina minCapacity y guests tomando el mayor", () => {
    const onlyH1 = filterHotels([h1, h2], { minCapacity: 3, guests: 2 });
    expect(onlyH1.map((h) => h.hotel_id)).toEqual(["h1"]);
  });

  it("filtra por amenidad", () => {
    const withWifi = hotel("h3", [roomType("r4", 2, ["wifi"])]);
    expect(filterHotels([h1, withWifi], { amenity: "wifi" }).map((h) => h.hotel_id)).toEqual([
      "h3",
    ]);
  });
});

describe("hotelStayAvailability", () => {
  const nights = ["2026-10-01", "2026-10-02"];
  const h = hotel("h1", [roomType("r1", 2)]);

  it("es available cuando todas las noches tienen stock", () => {
    const lookup = stock({ r1: { "2026-10-01": 3, "2026-10-02": 1 } });
    expect(hotelStayAvailability(h, nights, lookup)).toBe("available");
  });

  it("es unavailable cuando alguna noche está en cero con datos", () => {
    const lookup = stock({ r1: { "2026-10-01": 3, "2026-10-02": 0 } });
    expect(hotelStayAvailability(h, nights, lookup)).toBe("unavailable");
  });

  it("es unknown cuando no hay datos de inventario", () => {
    const lookup = stock({});
    expect(hotelStayAvailability(h, nights, lookup)).toBe("unknown");
  });

  it("es unknown cuando alguna noche no tiene datos", () => {
    const lookup = stock({ r1: { "2026-10-01": 3 } });
    expect(hotelStayAvailability(h, nights, lookup)).toBe("unknown");
  });

  it("sin fechas es unknown", () => {
    expect(hotelStayAvailability(h, [], stock({}))).toBe("unknown");
  });
});

describe("applyStayAvailability", () => {
  const nights = ["2026-10-01", "2026-10-02"];
  const available = hotel("a", [roomType("ra", 2)]);
  const unavailable = hotel("u", [roomType("ru", 2)]);
  const unknown = hotel("k", [roomType("rk", 2)]);

  const lookup = stock({
    ra: { "2026-10-01": 2, "2026-10-02": 2 },
    ru: { "2026-10-01": 2, "2026-10-02": 0 },
  });

  it("excluye solo los agotados y ordena available primero", () => {
    const { visible, status } = applyStayAvailability(
      [unavailable, unknown, available],
      { from: "2026-10-01", to: "2026-10-03", stock: lookup }
    );
    expect(visible.map((h) => h.hotel_id)).toEqual(["a", "k"]);
    expect(status.get("a")).toBe("available");
    expect(status.get("k")).toBe("unknown");
    expect(status.get("u")).toBe("unavailable");
  });

  it("no excluye nada cuando no hay datos de inventario", () => {
    const { visible } = applyStayAvailability([unavailable, unknown], {
      from: "2026-10-01",
      to: "2026-10-03",
      stock: stock({}),
    });
    expect(visible).toHaveLength(2);
  });

  it("sin fechas conserva el orden de entrada", () => {
    const { visible } = applyStayAvailability([unknown, available], {
      stock: lookup,
    });
    expect(visible.map((h) => h.hotel_id)).toEqual(["k", "a"]);
  });
});
