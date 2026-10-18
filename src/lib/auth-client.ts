"use client";

export interface AuthProfile {
  user_id: string;
  email: string;
  name: string;
  phone: string | null;
  picture_url: string | null;
  role: string;
  hotel_id: string | null;
  terms_accepted_at: string | null;
}

interface SessionPayload {
  user: {
    user_id: string;
    email: string;
    name: string;
    phone?: string | null;
    picture_url?: string | null;
    terms_accepted_at?: string | null;
  };
  assignment: { role: string; hotel_id: string | null } | null;
}

function toProfile(data: SessionPayload): AuthProfile {
  return {
    user_id: data.user.user_id,
    email: data.user.email,
    name: data.user.name,
    phone: data.user.phone ?? null,
    picture_url: data.user.picture_url ?? null,
    role: data.assignment?.role ?? "GUEST",
    hotel_id: data.assignment?.hotel_id ?? null,
    terms_accepted_at: data.user.terms_accepted_at ?? null,
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
  password: string,
  remember = false
): Promise<AuthProfile> {
  return postSession("/api/auth/login", { email, password, remember });
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  terms_accepted: true;
}): Promise<AuthProfile> {
  return postSession("/api/auth/register", input);
}

/** Registra la aceptación del tratamiento de datos (una sola vez). */
export async function acceptConsent(): Promise<{ terms_accepted_at: string }> {
  const res = await fetch("/api/auth/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accepted: true }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return (await res.json()) as { terms_accepted_at: string };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Perfil de la sesión actual (null si no hay sesión).
 *
 * Solo el 401 significa "sin sesión" y corta de inmediato. Los fallos de
 * red o 5xx/503 (backend despertando o caído) se reintentan con backoff:
 * las cookies pueden ser válidas aunque el primer intento falle.
 */
export async function me(retries = 2): Promise<AuthProfile | null> {
  let attempt = 0;
  for (;;) {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) return toProfile((await res.json()) as SessionPayload);
      // 401 = sin sesión, 4xx = error del cliente: no se recuperan solos.
      if (res.status === 401 || res.status < 500) return null;
      // 5xx/503: transitorio, se reintenta abajo.
    } catch {
      // Caída de red: se reintenta abajo.
    }
    if (attempt >= retries) return null;
    attempt += 1;
    await sleep(1000 * attempt);
  }
}

/** Actualiza nombre/teléfono del perfil propio. */
export async function updateMe(input: {
  name?: string;
  phone?: string;
}): Promise<AuthProfile> {
  const res = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  return toProfile((await res.json()) as SessionPayload);
}

/** Pide el enlace de recuperación (siempre OK, exista o no la cuenta). */
export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch("/api/auth/password/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
}

/**
 * Pide el código demo de 6 dígitos (opción C). En modo dev vuelve en la
 * respuesta para mostrarlo en pantalla; con SMTP real no se incluye.
 */
export async function requestCode(email: string): Promise<{ code?: string }> {
  const res = await fetch("/api/auth/password/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
  const data = (await res.json()) as { demo_code?: string };
  return data.demo_code ? { code: data.demo_code } : {};
}

/** Canjea el token del enlace por una contraseña nueva. */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const res = await fetch("/api/auth/password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
}

/** Baja de cuenta propia (variante A: falla con 409 si hay reservas activas). */
export async function deleteMe(input: {
  password?: string;
  confirm?: true;
}): Promise<void> {
  const res = await fetch("/api/auth/me", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `Error ${res.status}`
    );
  }
}

/**
 * Compatibilidad: el Bearer lo inyecta el middleware desde la cookie
 * HttpOnly, así que el cliente ya no adjunta cabeceras de auth.
 */
export function authHeader(): Record<string, string> {
  return {};
}
