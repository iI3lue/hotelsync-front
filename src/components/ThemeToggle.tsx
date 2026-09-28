"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const ORDER = ["light", "dark", "system"] as const;
type ThemeChoice = (typeof ORDER)[number];

const LABELS: Record<ThemeChoice, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
};

function ThemeIcon({ theme }: { theme: ThemeChoice }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    "aria-hidden": true,
  } as const;

  if (theme === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  if (theme === "dark") {
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonClass =
    "inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus-visible:ring-offset-gray-900";

  // Placeholder del mismo tamaño para evitar saltos de layout antes de hidratar.
  if (!mounted) {
    return (
      <span className={buttonClass} aria-hidden="true">
        <span className="inline-block h-[18px] w-[18px]" />
        <span className="inline-block h-4 w-14" />
      </span>
    );
  }

  const current: ThemeChoice =
    theme === "dark" || theme === "light" ? theme : "system";
  const next: ThemeChoice = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className={buttonClass}
      aria-label={`Cambiar tema (actual: ${LABELS[current]}). Cambiar a ${LABELS[next].toLowerCase()}`}
      title={`Tema: ${LABELS[current]}`}
    >
      <ThemeIcon theme={current} />
      <span>{LABELS[current]}</span>
    </button>
  );
}
