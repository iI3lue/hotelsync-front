import { adminSectionsFor, resolveViewedRole } from "@/lib/view-as";

describe("resolveViewedRole", () => {
  it("un SUPER_ADMIN con vista elegida ve ese rol", () => {
    expect(resolveViewedRole("SUPER_ADMIN", "GUEST")).toBe("GUEST");
    expect(resolveViewedRole("SUPER_ADMIN", "RECEPTIONIST")).toBe(
      "RECEPTIONIST"
    );
  });

  it("sin vista elegida el SUPER_ADMIN se ve a sí mismo", () => {
    expect(resolveViewedRole("SUPER_ADMIN", null)).toBe("SUPER_ADMIN");
  });

  it("un rol no-admin nunca simula: siempre se ve a sí mismo", () => {
    expect(resolveViewedRole("GUEST", "SUPER_ADMIN")).toBe("GUEST");
    expect(resolveViewedRole("RECEPTIONIST", "GUEST")).toBe("RECEPTIONIST");
  });

  it("sin sesión se asume invitado", () => {
    expect(resolveViewedRole(null, null)).toBe("GUEST");
  });
});

describe("adminSectionsFor", () => {
  it("recepcionista solo ve Recepción", () => {
    expect(adminSectionsFor("RECEPTIONIST").map((s) => s.href)).toEqual([
      "/admin/recepcion",
    ]);
  });

  it("limpieza solo ve Limpieza", () => {
    expect(adminSectionsFor("HOUSEKEEPER").map((s) => s.href)).toEqual([
      "/admin/housekeeping",
    ]);
  });

  it("manager ve Panel, Hoteles y Personal", () => {
    expect(adminSectionsFor("MANAGER").map((s) => s.href)).toEqual([
      "/admin",
      "/admin/hotels",
      "/admin/staff",
    ]);
  });

  it("invitado no ve secciones", () => {
    expect(adminSectionsFor("GUEST")).toEqual([]);
  });

  it("super admin ve Hoteles y Personal", () => {
    expect(adminSectionsFor("SUPER_ADMIN").map((s) => s.href)).toEqual([
      "/admin/hotels",
      "/admin/staff",
    ]);
  });
});
