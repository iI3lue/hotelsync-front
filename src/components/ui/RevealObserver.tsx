"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Activa las animaciones de entrada `[data-reveal]` (ver globals.css).
 * Un solo IntersectionObserver para todo el sitio; se re-escanea al
 * navegar y cuando el DOM cambia (Suspense, listados que cargan tarde).
 * Sin JavaScript nada queda oculto: la clase `js-reveal` la pone este
 * componente, y solo entonces los elementos arrancan escondidos.
 */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("js-reveal");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach((el) => {
        // Lo que ya está en pantalla al cargar se muestra de inmediato.
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
          requestAnimationFrame(() => el.classList.add("is-in"));
        } else {
          io.observe(el);
        }
      });
    };

    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
