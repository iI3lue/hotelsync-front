"use client";

export type PaymentChoice = "ONLINE" | "RECEPTION";

const OPTIONS: { value: PaymentChoice; title: string; detail: string; note: string }[] = [
  {
    value: "ONLINE",
    title: "Pagar ahora",
    detail: "Tarjeta de crédito o débito",
    note: "Confirmación inmediata",
  },
  {
    value: "RECEPTION",
    title: "Pagar en el hotel",
    detail: "Efectivo, tarjeta o transferencia al llegar",
    note: "Tu habitación queda reservada",
  },
];

/** Selector de método con radios reales (teclado y lector de pantalla). */
export default function PaymentMethodPicker({
  value,
  onChange,
  disabled,
}: {
  value: PaymentChoice;
  onChange: (v: PaymentChoice) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="input-label">Cómo querés pagar</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={`group relative flex cursor-pointer flex-col gap-1 border p-5 transition-colors duration-300 ${
                checked
                  ? "border-brand-navy bg-brand-navy/[0.03] dark:border-white dark:bg-white/[0.04]"
                  : "border-brand-navy/15 hover:border-brand-navy/40 dark:border-white/15 dark:hover:border-white/40"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="payment-method"
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              <span className="flex items-center justify-between gap-3">
                <span className="font-display text-[1.35rem] leading-tight text-brand-navy dark:text-white">{o.title}</span>
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    checked ? "border-brand-navy dark:border-white" : "border-brand-navy/30 dark:border-white/30"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full bg-brand-navy transition-transform duration-300 dark:bg-white ${checked ? "scale-100" : "scale-0"}`} />
                </span>
              </span>
              <span className="text-[0.875rem] text-brand-navy/65 dark:text-white/60">{o.detail}</span>
              <span className="mt-2 text-eyebrow uppercase text-brand-gold">{o.note}</span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 hidden ring-1 ring-brand-gold ring-offset-2 peer-focus-visible:block" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
