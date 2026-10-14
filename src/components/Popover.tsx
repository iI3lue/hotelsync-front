"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  /** Ref del elemento ancla: el popover se posiciona debajo de él. */
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Ancho mínimo igual al del ancla (útil en menús de formulario). */
  matchAnchorWidth?: boolean;
  /** Alineación horizontal respecto del ancla. */
  align?: "left" | "right";
  className?: string;
}

/**
 * Popover renderizado en un portal sobre `document.body` con posición fija
 * y z-index máximo. A diferencia de un `absolute` dentro del layout, ningún
 * ancestro puede recortarlo (overflow) ni taparlo (stacking contexts de
 * animaciones, transforms o backdrop-blur). Se reposiciona al hacer scroll
 * con el ancla visible y se cierra con Escape, scroll brusco o clic afuera.
 */
export default function Popover({
  anchorRef,
  open,
  onClose,
  children,
  matchAnchorWidth = false,
  align = "left",
  className = "",
}: PopoverProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [above, setAbove] = useState(false);

  // Si no entra debajo del ancla pero sí arriba, se abre hacia arriba.
  useLayoutEffect(() => {
    if (!open || !rect || !panelRef.current) return;
    const h = panelRef.current.offsetHeight;
    const fitsBelow = rect.bottom + 8 + h <= window.innerHeight;
    const fitsAbove = rect.top - 8 - h >= 0;
    setAbove(!fitsBelow && fitsAbove);
  }, [open, rect]);

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const el = anchorRef.current;
      if (!el) return;
      setRect(el.getBoundingClientRect());
    };
    update();
    window.addEventListener("resize", update);
    // Reposiciona mientras el ancla se mueve (scroll); si el ancla sale del
    // viewport, se cierra para no dejar un menú flotando huérfano.
    const onScroll = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) onClose();
      else setRect(r);
    };
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("keydown", onKey);
    };
  }, [open, anchorRef, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[200]"
      onPointerDown={(e) => {
        const anchor = anchorRef.current;
        const pop = (e.currentTarget as HTMLElement).querySelector(
          "[data-popover-panel]"
        );
        const t = e.target as Node;
        // Clic en el ancla lo maneja el propio trigger (toggle); clic en el
        // panel no cierra; todo lo demás cierra.
        if (anchor?.contains(t)) return;
        if (pop?.contains(t)) return;
        onClose();
      }}
    >
      <div
        data-popover-panel
        ref={panelRef}
        className={`absolute animate-scale-in ${above ? "origin-bottom" : "origin-top"} ${className}`}
        style={
          rect
            ? {
                ...(above
                  ? { bottom: window.innerHeight - rect.top + 8 }
                  : { top: rect.bottom + 8 }),
                ...(align === "right"
                  ? { right: Math.max(8, window.innerWidth - rect.right) }
                  : { left: Math.max(8, rect.left) }),
                minWidth: matchAnchorWidth ? rect.width : undefined,
              }
            : { visibility: "hidden" }
        }
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
