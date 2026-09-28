"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { es } from "react-day-picker/locale";
import { formatShort, fromIsoDate, toIsoDate } from "@/lib/dates";

const buttonClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-left text-gray-900 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";
const labelClass =
  "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-200";

interface DatePickerButtonProps {
  label: string;
  /** Controlado: valor actual. Si se omite, usa defaultValue (no controlado). */
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  minDate?: string;
  id?: string;
  /** Si se pasa, renderiza un hidden input para formularios GET clásicos. */
  name?: string;
}

/**
 * Selector de fecha único del front (público + admin): botón con popover
 * de calendario en español, con valor controlado o no controlado y
 * soporte de hidden input para formularios server-side.
 */
export default function DatePickerButton({
  label,
  value,
  defaultValue = "",
  onChange,
  minDate,
  id,
  name,
}: DatePickerButtonProps) {
  const [inner, setInner] = useState(value ?? defaultValue);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const min = minDate ? (fromIsoDate(minDate) ?? today) : today;
  const current = value ?? inner;
  const selected = current ? fromIsoDate(current) : undefined;

  useEffect(() => {
    if (value !== undefined) setInner(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open ]);

  const pick = (iso: string) => {
    if (onChange) onChange(iso);
    else setInner(iso);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative min-w-0">
      <span id={id ? `${id}-label` : undefined} className={labelClass}>
        {label}
      </span>
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        type="button"
        id={id}
        aria-labelledby={id ? `${id}-label` : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={buttonClass}
      >
        {current ? formatShort(current) : "Elegir fecha…"}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={label}
          className="absolute z-30 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          <DayPicker
            mode="single"
            locale={es}
            required
            selected={selected}
            onSelect={(d) => {
              if (d) pick(toIsoDate(d));
            }}
            disabled={{ before: min }}
            captionLayout="dropdown"
            startMonth={
              minDate
                ? new Date(today.getFullYear(), today.getMonth(), 1)
                : new Date(today.getFullYear() - 1, 0, 1)
            }
            endMonth={new Date(today.getFullYear() + 1, today.getMonth(), 1)}
          />
        </div>
      ) : null}
    </div>
  );
}
