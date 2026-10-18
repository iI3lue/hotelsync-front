"use client";

import {
  BRAND_LABEL,
  TEST_CARDS,
  cvcLength,
  detectBrand,
  formatCardNumber,
  formatExpiry,
  type CardErrors,
  type CardFields,
  type TestCard,
} from "@/lib/card";

interface CardFormProps {
  value: CardFields;
  onChange: (v: CardFields) => void;
  errors: CardErrors;
  disabled?: boolean;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-[0.8rem] text-red-700 dark:text-red-300">
      {message}
    </p>
  );
}

/**
 * Formulario de tarjeta de la pasarela SIMULADA. Los datos viajan una sola
 * vez a payment-service y nunca se guardan en el navegador.
 */
export default function CardForm({ value, onChange, errors, disabled }: CardFormProps) {
  const brand = detectBrand(value.number);
  const set = (patch: Partial<CardFields>) => onChange({ ...value, ...patch });
  const field = (name: keyof CardFields) =>
    `input-field ${errors[name] ? "border-red-600 focus:border-red-600 dark:border-red-400" : ""}`;

  // Un clic deja la tarjeta de prueba lista para enviar: número, fecha y código.
  const fillTestCard = (card: TestCard) => {
    const testBrand = detectBrand(card.number);
    set({
      number: card.number,
      expiry: "12/30",
      cvc: testBrand === "amex" ? "1234" : "123",
    });
  };

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-5">
      <legend className="sr-only">Datos de la tarjeta</legend>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="card-number" className="input-label">Número de tarjeta</label>
          <span className="text-eyebrow uppercase text-brand-navy/45 dark:text-white/40" aria-live="polite">
            {brand !== "unknown" ? BRAND_LABEL[brand] : ""}
          </span>
        </div>
        <input
          id="card-number"
          name="cc-number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="0000 0000 0000 0000"
          value={value.number}
          onChange={(e) => set({ number: formatCardNumber(e.target.value) })}
          aria-invalid={Boolean(errors.number)}
          aria-describedby={errors.number ? "card-number-error" : undefined}
          className={`${field("number")} font-mono tracking-wider`}
        />
        <FieldError id="card-number-error" message={errors.number} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="card-expiry" className="input-label">Vencimiento</label>
          <input
            id="card-expiry"
            name="cc-exp"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            value={value.expiry}
            onChange={(e) => set({ expiry: formatExpiry(e.target.value) })}
            aria-invalid={Boolean(errors.expiry)}
            aria-describedby={errors.expiry ? "card-expiry-error" : undefined}
            className={`${field("expiry")} font-mono`}
          />
          <FieldError id="card-expiry-error" message={errors.expiry} />
        </div>
        <div>
          <label htmlFor="card-cvc" className="input-label">Código de seguridad</label>
          <input
            id="card-cvc"
            name="cc-csc"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={brand === "amex" ? "4 dígitos" : "3 dígitos"}
            maxLength={cvcLength(brand)}
            value={value.cvc}
            onChange={(e) => set({ cvc: e.target.value.replace(/\D/g, "").slice(0, cvcLength(brand)) })}
            aria-invalid={Boolean(errors.cvc)}
            aria-describedby={errors.cvc ? "card-cvc-error" : undefined}
            className={`${field("cvc")} font-mono`}
          />
          <FieldError id="card-cvc-error" message={errors.cvc} />
        </div>
      </div>

      <div>
        <label htmlFor="card-holder" className="input-label">Nombre en la tarjeta</label>
        <input
          id="card-holder"
          name="cc-name"
          autoComplete="cc-name"
          placeholder="Como figura en la tarjeta"
          value={value.holder}
          onChange={(e) => set({ holder: e.target.value.slice(0, 100) })}
          aria-invalid={Boolean(errors.holder)}
          aria-describedby={errors.holder ? "card-holder-error" : undefined}
          className={field("holder")}
        />
        <FieldError id="card-holder-error" message={errors.holder} />
      </div>

      <div className="space-y-4 border-l-2 border-brand-gold bg-brand-paper p-4 dark:bg-white/5">
        <div className="flex items-start gap-3 text-[0.8125rem] leading-relaxed text-brand-navy/70 dark:text-white/65">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" fill="none" stroke="currentColor" strokeWidth={1.4}>
            <rect x="5" y="10.5" width="14" height="10" rx="1" />
            <path d="M8 10.5V7.5a4 4 0 018 0v3" />
          </svg>
          <p>
            Pasarela de prueba: no se cobra dinero real ni se guarda tu tarjeta. Tocá una
            tarjeta para completar los datos (después podés cambiar la fecha y el código).
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {TEST_CARDS.map((card) => (
            <li key={card.number}>
              <button
                type="button"
                onClick={() => fillTestCard(card)}
                title={card.approved ? "Aprueba el pago" : "Simula un rechazo"}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-left transition-colors ${
                  card.approved
                    ? "border-brand-navy/15 bg-white hover:border-brand-navy/45 dark:border-white/15 dark:bg-white/5 dark:hover:border-white/40"
                    : "border-red-300/70 bg-red-50/60 hover:border-red-400 dark:border-red-800/50 dark:bg-red-950/20 dark:hover:border-red-600/70"
                }`}
              >
                <span className="text-[0.78rem] font-semibold text-brand-navy dark:text-white">
                  {card.label}
                </span>
                <span className="font-mono text-[0.72rem] tabular-nums text-brand-navy/55 dark:text-white/45">
                  {card.number}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </fieldset>
  );
}
