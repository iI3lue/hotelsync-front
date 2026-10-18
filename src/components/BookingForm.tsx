"use client";

import { useEffect, useMemo, useState } from "react";
import type { Booking, BookingCreated, RoomType } from "@/lib/api";
import {
  ApiError,
  LONG_TIMEOUT_MS,
  clientFetch,
  fetchAvailabilityRange,
  fetchPaymentStatus,
  postJson,
  processWebPayment,
  type PaymentTransaction,
} from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { formatShort } from "@/lib/dates";
import { firstNightWithoutStock, stayNights } from "@/lib/stay-range";
import { roomImage } from "@/lib/imagery";
import {
  BRAND_LABEL,
  detectBrand,
  digitsOnly,
  parseExpiry,
  validateCard,
  type CardErrors,
  type CardFields,
} from "@/lib/card";
import RangeCalendar from "@/components/RangeCalendar";
import Money from "@/components/Money";
import Spinner from "@/components/Spinner";
import CardForm from "@/components/payments/CardForm";
import PaymentMethodPicker, { type PaymentChoice } from "@/components/payments/PaymentMethodPicker";
import PaymentBadge from "@/components/payments/PaymentBadge";
import PointsEarned from "@/components/payments/PointsEarned";
import Arrow from "@/components/ui/Arrow";

/* ─── Helpers ──────────────────────────────────────────────── */
function plusOneDay(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function diffNights(checkInIso: string, checkOutIso: string): number {
  const ms =
    new Date(`${checkOutIso}T12:00:00`).getTime() -
    new Date(`${checkInIso}T12:00:00`).getTime();
  return Math.round(ms / 86400000);
}

type BookingState = BookingCreated & Partial<Booking>;

/** Borrador en sessionStorage: si la página se recarga a mitad del pago,
 * se retoma la MISMA reserva en vez de crear otra. Solo id + token. */
interface Draft {
  booking_id: string;
  manage_token: string;
}
const draftKey = (roomTypeId: string, from: string, to: string) => `hs:booking-draft:${roomTypeId}:${from}:${to}`;

function readDraft(key: string): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}
function writeDraft(key: string, draft: Draft | null) {
  try {
    if (draft) window.sessionStorage.setItem(key, JSON.stringify(draft));
    else window.sessionStorage.removeItem(key);
  } catch {
    /* almacenamiento bloqueado: se sigue sin borrador */
  }
}

/* ─── Step indicator ────────────────────────────────────────── */
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Progreso de reserva" className="mb-10">
      <ol className="grid grid-cols-3 gap-3">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="min-w-0">
              <span
                className={`block h-px transition-colors duration-500 ${
                  done || active ? "bg-brand-navy dark:bg-white" : "bg-brand-navy/15 dark:bg-white/15"
                }`}
              />
              <span
                className={`mt-3 flex items-center gap-2 text-eyebrow uppercase ${
                  active ? "text-brand-navy dark:text-white" : "text-brand-navy/40 dark:text-white/40"
                }`}
              >
                <span className="tabular-nums">0{i + 1}</span>
                <span className={`truncate ${active ? "" : "hidden sm:inline"}`}>{label}</span>
                {done && (
                  <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 text-brand-gold">
                    <path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ─── Confirmación ──────────────────────────────────────────── */
function BookingSuccess({
  hotelName,
  roomTypeName,
  booking,
  payment,
  onCopy,
  copied,
}: {
  hotelName: string;
  roomTypeName: string;
  booking: BookingState;
  payment: PaymentTransaction | null;
  onCopy: (key: string, text: string) => void;
  copied: string | null;
}) {
  const paid = payment?.status === "COMPLETED" || booking.payment_status === "PAID";
  const confirmed = booking.status === "confirmed";
  const atReception = !paid && booking.payment_method_preference === "RECEPTION";

  const title = paid
    ? "Pago aprobado"
    : confirmed
      ? "Reserva confirmada"
      : "Estamos confirmando tu reserva";
  const lead = paid
    ? confirmed
      ? "Tu estancia está pagada y confirmada. Te esperamos."
      : "Recibimos tu pago. La confirmación de la habitación llega en unos segundos."
    : confirmed
      ? "Tu habitación está reservada. El pago lo hacés al llegar al hotel."
      : "Tu lugar está apartado; en cuanto el hotel confirme el inventario, la reserva queda firme.";

  const row = "flex items-baseline justify-between gap-4 py-3";
  return (
    <div className="animate-scale-in mx-auto max-w-2xl border border-brand-navy/10 bg-white p-8 dark:border-white/10 dark:bg-brand-navy-800 md:p-12">
      <div className="flex justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-brand-gold text-brand-gold">
          <svg aria-hidden="true" className="h-6 w-6 animate-check-draw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
      </div>
      <h2 className="mt-6 text-center font-display text-[2.25rem] leading-tight text-brand-navy dark:text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-center text-[0.95rem] text-brand-navy/60 dark:text-white/55">{lead}</p>

      <dl className="mt-10 divide-y divide-brand-navy/10 border-y border-brand-navy/10 text-[0.925rem] dark:divide-white/10 dark:border-white/10">
        <div className={row}>
          <dt className="text-brand-navy/55 dark:text-white/50">Hotel</dt>
          <dd className="text-right text-brand-navy dark:text-white">{hotelName}</dd>
        </div>
        <div className={row}>
          <dt className="text-brand-navy/55 dark:text-white/50">Habitación</dt>
          <dd className="text-right text-brand-navy dark:text-white">{roomTypeName}</dd>
        </div>
        <div className={row}>
          <dt className="text-brand-navy/55 dark:text-white/50">Estancia</dt>
          <dd className="text-right text-brand-navy dark:text-white">
            {formatDate(booking.check_in)} — {formatDate(booking.check_out)}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-brand-navy/55 dark:text-white/50">Pago</dt>
          <dd className="flex flex-col items-end gap-1 text-right text-brand-navy dark:text-white">
            <PaymentBadge status={paid ? "PAID" : "PENDING"} preference={booking.payment_method_preference} />
            {paid && payment?.card_last4 && (
              <span className="text-[0.8125rem] text-brand-navy/55 dark:text-white/50">
                {payment.card_brand ? `${payment.card_brand.charAt(0)}${payment.card_brand.slice(1).toLowerCase()}` : "Tarjeta"} •••• {payment.card_last4}
                {payment.auth_code ? ` · Aut. ${payment.auth_code}` : ""}
              </span>
            )}
            {atReception && (
              <span className="text-[0.8125rem] text-brand-navy/55 dark:text-white/50">Efectivo, tarjeta o transferencia en recepción</span>
            )}
          </dd>
        </div>
        <div className={row}>
          <dt className="eyebrow">{paid ? "Total pagado" : "Total a pagar"}</dt>
          <dd className="font-display text-[1.9rem] leading-none tabular-nums text-brand-navy dark:text-white">
            <Money amountCOP={booking.total_amount} />
          </dd>
        </div>
      </dl>

      {paid && (
        <div className="mt-6">
          <PointsEarned
            bookingId={booking.booking_id}
            amount={Number(booking.total_amount)}
            active
            className="border border-brand-navy/10 p-4 dark:border-white/10"
          />
        </div>
      )}

      <div className="mt-8 space-y-3">
        <CodeRow label="Código de reserva" value={booking.booking_id} copied={copied === "booking"} onCopy={() => onCopy("booking", booking.booking_id)} />
        {booking.manage_token && (
          <CodeRow
            label="Código de gestión (guardalo)"
            value={booking.manage_token}
            copied={copied === "manage"}
            onCopy={() => onCopy("manage", booking.manage_token!)}
          />
        )}
        <p className="text-center text-[0.8rem] text-brand-navy/45 dark:text-white/40">
          Con el código de gestión podés ver o cancelar tu reserva sin cuenta.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <a href="/mis-reservas" className="btn-primary">Ver mis reservas</a>
        <a href="/" className="link-line text-brand-navy dark:text-white">Volver al inicio</a>
      </div>
    </div>
  );
}

function CodeRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border border-brand-navy/10 px-4 py-3 dark:border-white/10">
      <div className="min-w-0">
        <p className="text-eyebrow uppercase text-brand-navy/45 dark:text-white/40">{label}</p>
        <p className="mt-1 truncate font-mono text-[0.8rem] text-brand-navy dark:text-white">{value}</p>
      </div>
      <button type="button" onClick={onCopy} className="shrink-0 text-eyebrow uppercase text-brand-navy underline underline-offset-4 dark:text-white">
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

/* ─── Main form ─────────────────────────────────────────────── */
interface BookingFormProps {
  hotelId: string;
  hotelName: string;
  roomType: RoomType;
  date: string;
  initialFrom?: string;
  initialTo?: string;
}

const STEPS = ["Fechas", "Datos", "Pago"];
const EMPTY_CARD: CardFields = { number: "", expiry: "", cvc: "", holder: "" };

export default function BookingForm({
  hotelId,
  hotelName,
  roomType,
  date,
  initialFrom,
  initialTo,
}: BookingFormProps) {
  const [step, setStep] = useState(0);

  const [checkIn, setCheckIn] = useState(initialFrom || date);
  const [checkOut, setCheckOut] = useState(initialTo || (date ? plusOneDay(date) : ""));

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [method, setMethod] = useState<PaymentChoice>("ONLINE");
  const [card, setCard] = useState<CardFields>(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});

  // `booking` existe desde que se creó (aunque el pago falle): los
  // reintentos cobran la MISMA reserva, nunca crean otra.
  const [booking, setBooking] = useState<BookingState | null>(null);
  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [done, setDone] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState("");
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const rate = Number(roomType.base_rate);
  const nights = checkIn && checkOut ? diffNights(checkIn, checkOut) : 0;
  const total = nights > 0 ? rate * nights : null;
  const draftId = useMemo(() => draftKey(roomType.room_type_id, checkIn, checkOut), [roomType.room_type_id, checkIn, checkOut]);

  // Retoma una reserva pendiente de pago si la página se recargó.
  useEffect(() => {
    const draft = readDraft(draftId);
    if (!draft) return;
    let active = true;
    clientFetch<Booking>(`/api/booking/bookings/${draft.booking_id}`, {}, { "x-manage-token": draft.manage_token })
      .then((b) => {
        if (!active) return;
        if (b.status === "cancelled" || b.payment_status === "PAID") {
          writeDraft(draftId, null);
          return;
        }
        setBooking({ ...b, manage_token: draft.manage_token, created: true } as BookingState);
        setGuestName(b.guest_name ?? "");
        setGuestEmail(b.guest_email ?? "");
        setGuestPhone(b.guest_phone ?? "");
        setStep(2);
      })
      .catch(() => writeDraft(draftId, null));
    return () => {
      active = false;
    };
  }, [draftId]);

  /* ── Navegación ── */
  async function goNext() {
    setError(null);
    if (step === 0) {
      if (!checkIn || !checkOut) { setError("Elegí ambas fechas para continuar."); return; }
      if (nights <= 0) { setError("La salida tiene que ser posterior a la llegada."); return; }
      // Valida cada noche (el rango puede cruzar meses que el calendario no
      // cargó). El backend decide con 409 de todos modos.
      setChecking(true);
      try {
        const lastNight = stayNights(checkIn, checkOut).at(-1) ?? checkIn;
        const range = await fetchAvailabilityRange(roomType.room_type_id, checkIn, lastNight);
        const stock: Record<string, number> = {};
        for (const [iso, a] of Object.entries(range)) stock[iso] = Number(a.available ?? 0);
        const missing = firstNightWithoutStock(stayNights(checkIn, checkOut), stock);
        if (missing) {
          setError(`No quedan habitaciones el ${formatShort(missing)}. Elegí otras fechas.`);
          return;
        }
      } catch {
        /* sin verificación previa: decide el backend */
      } finally {
        setChecking(false);
      }
    }
    if (step === 1) {
      if (guestName.trim().length < 2) { setError("Escribí tu nombre completo."); return; }
      if (!/^\S+@\S+\.\S+$/.test(guestEmail.trim())) { setError("Revisá el correo electrónico."); return; }
      if (guestPhone.trim().length < 6) { setError("Escribí un teléfono de contacto."); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  /* ── Crear reserva ── */
  async function createBooking(preference: PaymentChoice): Promise<BookingState> {
    const created = await postJson<BookingState>(
      "/api/booking/bookings",
      {
        hotel_id: hotelId,
        room_type_id: roomType.room_type_id,
        check_in: checkIn,
        check_out: checkOut,
        channel: "direct",
        total_amount: total,
        payment_method_preference: preference,
        guest: { name: guestName.trim(), email: guestEmail.trim(), phone: guestPhone.trim() },
      },
      {},
      // Sin reintento (POST) pero con timeout largo para backends dormidos.
      { timeoutMs: LONG_TIMEOUT_MS }
    );
    if (created.status === "pending" && created.manage_token) {
      writeDraft(draftId, { booking_id: created.booking_id, manage_token: created.manage_token });
    }
    return created;
  }

  /** Confirma tras el pago (el front orquesta; el consumidor de eventos
   * también lo hace, así que un 409 "ya confirmada" es éxito). */
  async function confirmBooking(current: BookingState): Promise<BookingState> {
    const headers: Record<string, string> = current.manage_token ? { "x-manage-token": current.manage_token } : {};
    try {
      const updated = await postJson<Booking>(`/api/booking/bookings/${current.booking_id}/confirm`, {}, headers, {
        timeoutMs: LONG_TIMEOUT_MS,
      });
      return { ...current, ...updated };
    } catch (err) {
      try {
        const fresh = await clientFetch<Booking>(`/api/booking/bookings/${current.booking_id}`, {}, headers);
        return { ...current, ...fresh };
      } catch {
        if (err instanceof ApiError && err.status === 409) return current;
        throw err;
      }
    }
  }

  function bookingErrorMessage(err: unknown): string {
    if (err instanceof ApiError && err.status === 409) {
      return "No quedan habitaciones de este tipo para esas fechas. Probá con otras fechas u otra habitación.";
    }
    if (err instanceof ApiError && err.status === 400) return "Revisá los datos de la reserva e intentá de nuevo.";
    return "No pudimos crear la reserva. Revisá tu conexión e intentá de nuevo.";
  }

  /* ── Cobro con tarjeta ── */
  async function payOnline(current: BookingState): Promise<PaymentTransaction | null> {
    const exp = parseExpiry(card.expiry)!;
    try {
      const res = await processWebPayment(
        current.booking_id,
        { number: digitsOnly(card.number), exp_month: exp.month, exp_year: exp.year, cvc: card.cvc, holder: card.holder.trim() },
        current.manage_token
      );
      return res.data;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 402) {
          setCard((c) => ({ ...c, cvc: "" }));
          setError(`${err.message}. No se hizo ningún cobro: probá con otra tarjeta o elegí pagar en el hotel.`);
        } else if (err.status === 409 && err.code === "PaymentInProgress") {
          setError("Ya hay un pago en curso para esta reserva. Esperá unos segundos y volvé a intentar.");
        } else if (err.status === 429) {
          setError("Se alcanzó el máximo de intentos con tarjeta. Podés elegir pagar en el hotel.");
        } else {
          setError(`${err.message}.`);
        }
        return null;
      }
      // Red caída o timeout: el resultado es incierto. Nunca se reintenta el
      // cobro a ciegas; se consulta el estado (el servidor es idempotente).
      try {
        const status = await fetchPaymentStatus(current.booking_id, current.manage_token);
        if (status.transaction?.status === "COMPLETED") return status.transaction;
        setError("Se cortó la conexión y el pago no llegó a procesarse. Podés intentarlo de nuevo.");
      } catch {
        setError("Se cortó la conexión. Antes de reintentar, revisá en Mis reservas si el pago figura.");
      }
      return null;
    }
  }

  /* ── Enviar: crear → pagar → confirmar ── */
  async function handleSubmit() {
    if (!checkIn || !checkOut || total === null) return;
    setError(null);
    if (method === "ONLINE") {
      const errs = validateCard(card);
      setCardErrors(errs);
      if (Object.keys(errs).length > 0) return;
    }

    setSaving(true);
    try {
      let current = booking;
      if (!current) {
        setSavingLabel(method === "ONLINE" ? "Reservando la habitación…" : "Confirmando tu reserva…");
        try {
          current = await createBooking(method);
        } catch (err) {
          setError(bookingErrorMessage(err));
          return;
        }
        setBooking(current);
      }

      if (method === "RECEPTION") {
        // Reserva nueva: ya nace confirmada. Reserva creada para pago en
        // línea y luego cambiada a "pagar en el hotel": se confirma ahora.
        if (current.status === "pending" && current.payment_method_preference !== "RECEPTION") {
          setSavingLabel("Confirmando tu reserva…");
          current = await confirmBooking(current);
          setBooking(current);
        }
        writeDraft(draftId, null);
        setDone(true);
        return;
      }

      setSavingLabel("Procesando el pago…");
      const tx = await payOnline(current);
      if (!tx) return;
      setPayment(tx);
      writeDraft(draftId, null);

      setSavingLabel("Confirmando tu reserva…");
      try {
        current = await confirmBooking(current);
        setBooking(current);
      } catch {
        /* pago OK; la confirmación la completa booking-service al procesar el evento */
      }
      setDone(true);
    } finally {
      setSaving(false);
      setSavingLabel("");
    }
  }

  async function copyText(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied((p) => (p === key ? null : p)), 2000);
    } catch {
      /* noop */
    }
  }

  if (done && booking) {
    return (
      <BookingSuccess
        hotelName={hotelName}
        roomTypeName={roomType.name}
        booking={booking}
        payment={payment}
        onCopy={(k, t) => void copyText(k, t)}
        copied={copied}
      />
    );
  }

  const brand = detectBrand(card.number);
  const lockedStay = Boolean(booking); // con reserva creada no se cambian fechas ni datos

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-14">
      <div className="min-w-0 border border-brand-navy/10 bg-white p-6 dark:border-white/10 dark:bg-brand-navy-800 md:p-10">
        <StepIndicator steps={STEPS} current={step} />

        {/* ── Paso 1: fechas ── */}
        {step === 0 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <h2 className="mb-2 font-display text-[1.9rem] leading-tight text-brand-navy dark:text-white">Elegí tus fechas</h2>
              <p className="text-[0.925rem] text-brand-navy/60 dark:text-white/55">
                Tocá la llegada y después la salida. Los días subrayados tienen habitaciones libres.
              </p>
            </div>
            <fieldset className="min-w-0">
              <legend className="input-label mb-2">Estancia</legend>
              <RangeCalendar
                roomTypeId={roomType.room_type_id}
                from={checkIn || undefined}
                to={checkOut || undefined}
                onChange={(from, to) => {
                  setCheckIn(from);
                  setCheckOut(to);
                }}
              />
            </fieldset>
            {checking && (
              <p aria-live="polite" className="text-[0.875rem] text-brand-navy/60 dark:text-white/55">
                Verificando disponibilidad de cada noche…
              </p>
            )}
          </div>
        )}

        {/* ── Paso 2: datos ── */}
        {step === 1 && (
          <div className="animate-slide-up space-y-6">
            <div>
              <h2 className="mb-2 font-display text-[1.9rem] leading-tight text-brand-navy dark:text-white">Datos del huésped</h2>
              <p className="text-[0.925rem] text-brand-navy/60 dark:text-white/55">
                El hotel te identifica con estos datos al llegar.
              </p>
            </div>
            <fieldset className="space-y-5" disabled={lockedStay}>
              <legend className="sr-only">Datos del huésped</legend>
              <div>
                <label htmlFor="booking-guest-name" className="input-label">Nombre completo</label>
                <input id="booking-guest-name" type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} autoComplete="name" placeholder="Ana Gómez" className="input-field" required />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="booking-guest-email" className="input-label">Correo electrónico</label>
                  <input id="booking-guest-email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} autoComplete="email" placeholder="vos@ejemplo.com" className="input-field" required />
                </div>
                <div>
                  <label htmlFor="booking-guest-phone" className="input-label">Teléfono</label>
                  <input id="booking-guest-phone" type="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} autoComplete="tel" placeholder="+57 300 123 4567" className="input-field" required />
                </div>
              </div>
            </fieldset>
            <p className="text-[0.8rem] text-brand-navy/45 dark:text-white/40">
              Sin cuenta también podés reservar: te damos un código para gestionar la estancia.
            </p>
          </div>
        )}

        {/* ── Paso 3: pago ── */}
        {step === 2 && (
          <div className="animate-slide-up space-y-8">
            <div>
              <h2 className="mb-2 font-display text-[1.9rem] leading-tight text-brand-navy dark:text-white">Pago</h2>
              <p className="text-[0.925rem] text-brand-navy/60 dark:text-white/55">
                {booking
                  ? "Tu habitación está apartada. Completá el pago o elegí pagar al llegar."
                  : "Elegí cómo pagar. En ambos casos el precio es el mismo."}
              </p>
            </div>

            <PaymentMethodPicker value={method} onChange={(v) => { setMethod(v); setError(null); }} disabled={saving} />

            {method === "ONLINE" ? (
              <CardForm value={card} onChange={setCard} errors={cardErrors} disabled={saving} />
            ) : (
              <div className="border-l-2 border-brand-gold bg-brand-paper p-5 text-[0.9rem] leading-relaxed text-brand-navy/75 dark:bg-white/5 dark:text-white/70">
                Reservamos tu habitación ahora y pagás <strong className="font-medium text-brand-navy dark:text-white">{total !== null ? <Money amountCOP={total} /> : ""}</strong> en
                recepción, con efectivo, tarjeta o transferencia. Las condiciones de cancelación están en la página del hotel.
              </div>
            )}
          </div>
        )}

        {/* Error */}
        <div aria-live="polite">
          {error && (
            <p role="alert" className="animate-notice-in mt-6 border-l-2 border-red-600 bg-red-50 p-4 text-[0.9rem] text-red-800 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}
        </div>

        {/* Navegación */}
        <div className="mt-10 flex items-center justify-between gap-4 border-t border-brand-navy/10 pt-6 dark:border-white/10">
          {step > 0 && !(step === 2 && lockedStay) ? (
            <button type="button" onClick={goBack} className="link-line text-brand-navy dark:text-white" disabled={saving}>
              <Arrow className="h-2.5 w-5" direction="left" /> Atrás
            </button>
          ) : (
            <span />
          )}

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => void goNext()} disabled={checking} className="btn-primary">
              {checking ? "Verificando…" : "Continuar"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              aria-busy={saving}
              className="btn-primary min-w-[14rem]"
            >
              {saving ? (
                <Spinner label={savingLabel || "Procesando…"} />
              ) : method === "ONLINE" ? (
                <>Pagar {total !== null ? <Money amountCOP={total} /> : ""}</>
              ) : (
                "Confirmar reserva"
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Resumen de la estancia (fijo en escritorio) ── */}
      <aside aria-label="Resumen de tu estancia" className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-stone dark:bg-brand-navy-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={roomImage(roomType, 1000)} alt={roomType.name} className="h-full w-full object-cover" />
        </div>
        <p className="eyebrow mt-6">{hotelName}</p>
        <h2 className="mt-2 font-display text-[1.75rem] leading-tight text-brand-navy dark:text-white">{roomType.name}</h2>
        <dl className="mt-6 divide-y divide-brand-navy/10 border-y border-brand-navy/10 text-[0.9rem] dark:divide-white/10 dark:border-white/10">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-navy/55 dark:text-white/50">Llegada</dt>
            <dd className="text-brand-navy dark:text-white">{checkIn ? formatDate(checkIn) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-navy/55 dark:text-white/50">Salida</dt>
            <dd className="text-brand-navy dark:text-white">{checkOut ? formatDate(checkOut) : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-navy/55 dark:text-white/50">Noches</dt>
            <dd className="tabular-nums text-brand-navy dark:text-white">{nights > 0 ? nights : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-brand-navy/55 dark:text-white/50">Tarifa por noche</dt>
            <dd className="tabular-nums text-brand-navy dark:text-white"><Money amountCOP={rate} /></dd>
          </div>
          {step === 2 && (
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-brand-navy/55 dark:text-white/50">Pago</dt>
              <dd className="text-brand-navy dark:text-white">
                {method === "ONLINE" ? (brand !== "unknown" ? `${BRAND_LABEL[brand]} · ahora` : "Tarjeta · ahora") : "En el hotel"}
              </dd>
            </div>
          )}
        </dl>
        <div className="flex items-baseline justify-between pt-5">
          <span className="eyebrow">Total</span>
          <span className="font-display text-[2.25rem] leading-none tabular-nums text-brand-navy dark:text-white">
            {total !== null ? <Money amountCOP={total} /> : "—"}
          </span>
        </div>
        {booking && (
          <p className="mt-4 text-[0.8rem] text-brand-navy/50 dark:text-white/45">
            Reserva <span className="font-mono">{booking.booking_id.slice(0, 8)}</span> apartada · pago pendiente
          </p>
        )}
      </aside>
    </div>
  );
}
