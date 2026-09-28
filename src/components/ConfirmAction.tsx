"use client";

import { useEffect, useRef, useState } from "react";

interface ConfirmActionProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerLabel: string;
  triggerHref?: string;
  tone?: "danger" | "primary";
}

/**
 * Acción destructiva con confirmación (modal con foco + Escape).
 * Si se pasa triggerHref, el trigger es un enlace; si no, un botón
 * que solo cierra el modal (para acciones futuras con server action).
 */
export default function ConfirmAction({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  triggerLabel,
  triggerHref,
  tone = "danger",
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          tone === "danger"
            ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            : "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
        }`}
      >
        {triggerLabel}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="mb-2 text-lg font-semibold text-balance">
              {title}
            </h2>
            <p id="confirm-desc" className="mb-6 break-words text-gray-600 dark:text-gray-300">
              {description}
            </p>
            <div className="flex justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => setOpen(false)}
                className="rounded border border-gray-300 px-4 py-2 font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
              >
                {cancelLabel}
              </button>
              {triggerHref ? (
                <a
                  href={triggerHref}
                  className={`rounded px-4 py-2 font-medium text-white transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    tone === "danger"
                      ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
                      : "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500"
                  }`}
                >
                  {confirmLabel}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={`rounded px-4 py-2 font-medium text-white transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    tone === "danger"
                      ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
                      : "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500"
                  }`}
                >
                  {confirmLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
