import { cookies } from "next/headers";

export interface SessionScope {
  role: string | null;
  hotel_id: string | null;
}

/**
 * Alcance de la sesión desde la cookie HttpOnly `hs_access` (solo servidor:
 * Server Components y Route Handlers). Solo decodifica el payload (sin
 * verificar firma — eso lo hace cada microservicio con el Bearer). Si no
 * hay sesión, devuelve nulls y la página cae al comportamiento por defecto
 * (el middleware ya redirige a los no autorizados).
 */
export async function getSessionScope(): Promise<SessionScope> {
  try {
    const store = await cookies();
    const access = store.get("hs_access")?.value;
    if (!access) return { role: null, hotel_id: null };
    const parts = access.split(".");
    if (parts.length !== 3) return { role: null, hotel_id: null };
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    ) as { role?: string; hotel_id?: string | null };
    return {
      role: typeof payload.role === "string" ? payload.role : null,
      hotel_id:
        typeof payload.hotel_id === "string" ? payload.hotel_id : null,
    };
  } catch {
    return { role: null, hotel_id: null };
  }
}
