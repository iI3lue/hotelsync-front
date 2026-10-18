/**
 * Utilidades de tarjeta para el formulario de pago (solo presentación y
 * validación previa). La autorización real la decide payment-service; el
 * número nunca se guarda en el navegador ni en logs.
 */
export type CardBrand = "visa" | "mastercard" | "amex" | "unknown";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function detectBrand(value: string): CardBrand {
  const d = digitsOnly(value);
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  return "unknown";
}

export const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  unknown: "Tarjeta",
};

export function maxLength(brand: CardBrand): number {
  return brand === "amex" ? 15 : 16;
}

export function cvcLength(brand: CardBrand): number {
  return brand === "amex" ? 4 : 3;
}

/** "4111111111111111" → "4111 1111 1111 1111"; Amex en 4-6-5. */
export function formatCardNumber(value: string): string {
  const brand = detectBrand(value);
  const d = digitsOnly(value).slice(0, maxLength(brand) === 15 ? 15 : 19);
  if (brand === "amex") {
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ");
  }
  return d.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function luhnValid(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Acepta "1", "12", "122", "1230" y devuelve "MM/AA" progresivo. */
export function formatExpiry(value: string): string {
  let d = digitsOnly(value).slice(0, 4);
  if (d.length === 1 && Number(d) > 1) d = `0${d}`;
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function parseExpiry(value: string): { month: number; year: number } | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

export function expiryInFuture(month: number, year: number, now = new Date()): boolean {
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth.getTime() >= now.getTime();
}

export interface CardFields {
  number: string;
  expiry: string;
  cvc: string;
  holder: string;
}

export type CardErrors = Partial<Record<keyof CardFields, string>>;

export function validateCard(fields: CardFields, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  const brand = detectBrand(fields.number);
  if (!luhnValid(fields.number)) errors.number = "Revisá el número de la tarjeta.";
  const exp = parseExpiry(fields.expiry);
  if (!exp) errors.expiry = "Usá el formato MM/AA.";
  else if (!expiryInFuture(exp.month, exp.year, now)) errors.expiry = "La tarjeta está vencida.";
  if (digitsOnly(fields.cvc).length !== cvcLength(brand)) {
    errors.cvc = `El código tiene ${cvcLength(brand)} dígitos.`;
  }
  if (fields.holder.trim().length < 2) errors.holder = "Escribí el nombre como figura en la tarjeta.";
  return errors;
}

export interface TestCard {
  number: string;
  label: string;
  approved: boolean;
}

/**
 * Tarjetas de la pasarela simulada (documentadas en payment-service).
 * Todas pasan Luhn; `approved: false` es la única que la pasarela rechaza.
 */
export const TEST_CARDS: readonly TestCard[] = [
  { number: "4111 1111 1111 1111", label: "Visa", approved: true },
  { number: "5555 5555 5555 4444", label: "Mastercard", approved: true },
  { number: "3782 822463 10005", label: "American Express", approved: true },
  { number: "4000 0000 0000 0002", label: "Rechazo simulado", approved: false },
];
