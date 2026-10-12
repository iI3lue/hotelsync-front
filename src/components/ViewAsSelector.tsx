"use client";

import { useState } from "react";
import {
  VIEW_AS_LABELS,
  VIEW_AS_ROLES,
  type ViewAsRole,
} from "@/lib/view-as";

interface ViewAsSelectorProps {
  viewAs: ViewAsRole | null;
  onSelect: (role: ViewAsRole | null) => void;
  compact?: boolean;
}

/**
 * Selector "Ver como…" — solo lo monta el navbar cuando el rol REAL es
 * SUPER_ADMIN. Cambia únicamente el renderizado; la sesión no se toca.
 */
export default function ViewAsSelector({
  viewAs,
  onSelect,
  compact = false,
}: ViewAsSelectorProps) {
  const [open, setOpen] = useState(false);
  const current: ViewAsRole = viewAs ?? "SUPER_ADMIN";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Ver como (actual: ${VIEW_AS_LABELS[current]})`}
        title={`Viendo como ${VIEW_AS_LABELS[current]}`}
        className={
          compact
            ? "flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            : "flex h-9 items-center gap-1.5 rounded-xl border border-brand-gold/40 px-3 text-xs font-semibold text-brand-navy transition-colors hover:bg-brand-gold/10 dark:text-brand-gold"
        }
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className={compact ? "" : "hidden lg:inline"}>
          {compact ? `Ver como: ${VIEW_AS_LABELS[current]}` : VIEW_AS_LABELS[current]}
        </span>
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""} ${compact ? "" : "hidden lg:block"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="listbox"
            aria-label="Elegir vista por rol"
            className="animate-scale-in absolute right-0 top-11 z-40 min-w-48 overflow-hidden rounded-2xl border border-white/10 bg-white py-1 shadow-elevated dark:bg-brand-navy-800"
          >
            {VIEW_AS_ROLES.map((role) => {
              const active = current === role;
              return (
                <button
                  key={role}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onSelect(role === "SUPER_ADMIN" ? null : role);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-brand-gold/15 font-bold text-brand-navy dark:text-brand-gold"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  {VIEW_AS_LABELS[role]}
                  {active && <span className="text-sm font-bold text-brand-gold">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
