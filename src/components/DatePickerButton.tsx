"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { es } from "react-day-picker/locale";
import { formatShort, fromIsoDate, toIsoDate } from "@/lib/dates";
import Popover from "@/components/Popover";

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
  /** Compact mode: hide label, use inline text trigger (for SearchBar). */
  compact?: boolean;
  /** Hero mode: white text on dark background trigger. */
  heroMode?: boolean;
  /** Pinta un rango ya elegido sin cambiar la selección (solo visual). */
  rangeFrom?: string;
  rangeTo?: string;
  /**
   * Contador externo: cuando cambia, abre el calendario. Permite que todo
   * el contenedor padre abra el picker (hitbox amplia) sin anidar botones.
   */
  openSignal?: number;
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
  compact = false,
  heroMode = false,
  rangeFrom,
  rangeTo,
  openSignal = 0,
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

  // Apertura desde el contenedor padre (hitbox amplia): el padre incrementa
  // openSignal al clickearse; se ignora el valor inicial.
  const signalRef = useRef(openSignal);
  useEffect(() => {
    if (signalRef.current !== openSignal) {
      signalRef.current = openSignal;
      setOpen(true);
    }
  }, [openSignal]);

  // El cierre por clic afuera/Escape lo maneja el Popover portal.
  // (Un listener propio cerraría en `pointerdown`, antes de que el clic
  // en un día del calendario llegue a dispararse.)

  const pick = (iso: string) => {
    if (onChange) onChange(iso);
    else setInner(iso);
    setOpen(false);
  };

  const triggerClass = compact
    ? heroMode
      ? "bg-transparent text-sm font-medium text-white placeholder-blue-100/40 outline-none cursor-pointer w-full text-left"
      : "bg-transparent text-sm font-medium text-brand-navy outline-none cursor-pointer w-full text-left dark:text-white"
    : buttonClass;

  // Rango ya elegido, solo visual: marca el otro extremo y sombrea el medio.
  const rangeFromDate = rangeFrom ? fromIsoDate(rangeFrom) : undefined;
  const rangeToDate = rangeTo ? fromIsoDate(rangeTo) : undefined;
  const rangeModifiers =
    rangeFromDate || rangeToDate
      ? {
          ...(rangeFromDate ? { range_from: rangeFromDate } : {}),
          ...(rangeFromDate && rangeToDate && rangeFromDate < rangeToDate
            ? { range_middle: { after: rangeFromDate, before: rangeToDate } }
            : {}),
        }
      : undefined;

  return (
    <div ref={boxRef} className="relative min-w-0 w-full">
      {!compact && (
        <span id={id ? `${id}-label` : undefined} className={labelClass}>
          {label}
        </span>
      )}
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <button
        type="button"
        id={id}
        aria-label={compact ? label : undefined}
        aria-labelledby={!compact && id ? `${id}-label` : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={triggerClass}
      >
        {current
          ? <span className={heroMode ? "text-white" : "text-brand-navy dark:text-white"}>{formatShort(current)}</span>
          : <span className={heroMode ? "text-blue-200/50" : "text-gray-400"}>Elegir fecha…</span>
        }
      </button>
      <Popover anchorRef={boxRef} open={open} onClose={() => setOpen(false)}>
        <div
          role="dialog"
          aria-label={label}
          className="rounded-2xl border border-gray-200 bg-white p-3 shadow-elevated dark:border-white/10 dark:bg-brand-navy-800"
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
            modifiers={rangeModifiers}
            modifiersClassNames={
              rangeModifiers
                ? { range_from: "cal-range-from", range_middle: "cal-range-middle" }
                : undefined
            }
            captionLayout="dropdown"
            startMonth={
              minDate
                ? new Date(today.getFullYear(), today.getMonth(), 1)
                : new Date(today.getFullYear() - 1, 0, 1)
            }
            endMonth={new Date(today.getFullYear() + 1, today.getMonth(), 1)}
          />
        </div>
      </Popover>
    </div>
  );
}
