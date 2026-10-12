"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { me } from "@/lib/auth-client";
import { useToast } from "@/components/Toast";

/**
 * Muestra el toast post-login una sola vez cuando la URL trae
 * `?login=google` (el callback OAuth redirige con ese marcador) y
 * después limpia el parámetro sin recargar.
 */
export default function LoginToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { success } = useToast();
  const done = useRef(false);

  useEffect(() => {
    if (done.current || params.get("login") !== "google") return;
    done.current = true;
    void me().then((profile) => {
      success(
        "Sesión iniciada con Google",
        profile ? profile.email : undefined
      );
    });
    router.replace(pathname);
  }, [params, pathname, router, success]);

  return null;
}
