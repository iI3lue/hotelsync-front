"use client";

export interface AuthProfile {
  user_id: string;
  email: string;
  name: string;
  role: string;
  hotel_id: string | null;
}

interface SessionPayload {
  user: { user_id: string; email: string; name: string };
  assignment: { role: string; hotel_id: string | null } | null;
}

function toProfile(data: SessionPayload): AuthProfile {
  return {
    user_id: data.user.user_id,
    email: data.user.email,
    name: data.user.name,
    role: data.assignment?.role ?? "GUEST",
    hotel_id: data.assignment?.hotel_id ?? null,
  };
}

async function postSession(
  url: string,
  body: unknown
): Promise<AuthProfile> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return toProfile((await res.json()) as SessionPayload);
}

export async function login(
  email: string,
  password: string
): Promise<AuthProfile> {
  return postSession("/api/auth/login", { email, password });
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthProfile> {
  return postSession("/api/auth/register", input);
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
}

/** Perfil de la sesión actual (null si no hay sesión). */
export async function me(): Promise<AuthProfile | null> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return null;
    return toProfile((await res.json()) as SessionPayload);
  } catch {
    return null;
  }
}

/**
 * Compatibilidad: el Bearer lo inyecta el middleware desde la cookie
 * HttpOnly, así que el cliente ya no adjunta cabeceras de auth.
 */
export function authHeader(): Record<string, string> {
  return {};
}
