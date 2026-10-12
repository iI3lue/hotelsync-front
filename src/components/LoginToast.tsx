"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { me } from "@/lib/auth-client";
import { useToast } from "@/components/Toast";

/**
 * Muestra el toast post-login una sola vez cuando la URL trae
 * `?login=google` o `?login=email` (el callback OAuth y el login con
 * contraseña redirigen con ese marcador, con recarga completa para que
 * toda la UI vea la sesión nueva) y después limpia el parámetro.
 */
export default function LoginToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { success } = useToast();
  const done = useRef(false);

  useEffect(() => {
    const via = params.get("login");
    if (done.current || (via !== "google" && via !== "email")) return;
    done.current = true;
    void me().then((profile) => {
      success(
        via === "google"
          ? "Sesión iniciada con Google"
          : "Inicio de sesión exitoso",
        profile ? profile.email : undefined
      );
    });
    router.replace(pathname);
  }, [params, pathname, router, success]);

  return null;
}
