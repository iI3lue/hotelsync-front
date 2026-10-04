"use client";

import { useEffect, useState } from "react";

const buttonClass =
  "flex w-full items-center justify-center gap-3 rounded border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600";

/** Botón de Google: solo se muestra si el proveedor está configurado. */
export default function GoogleButton({ returnTo }: { returnTo: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json() as Promise<{ google?: boolean }>)
      .then((data) => setEnabled(data.google === true))
      .catch(() => setEnabled(false));
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-500 dark:text-gray-400">o</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
      </div>
      <a
        href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
        className={buttonClass}
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.3 3.5 2.7.2.1c2.2-2 3.6-5 3.6-9.1z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.2.1-3.6 2.8-.1.2C3.3 21.3 7.3 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.3-3.5-2.7-.1.1C.5 8.7 0 10.2 0 12s.5 3.3 1.5 4.6l3.7-2.2z"
          />
          <path
            fill="#EA4335"
            d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.2-3.1C16.9 1.1 14.7 0 12 0 7.3 0 3.3 2.7 1.5 6.6l3.7 2.9c1-2.9 3.7-4.8 6.8-4.8z"
          />
        </svg>
        Continuar con Google
      </a>
    </>
  );
}
