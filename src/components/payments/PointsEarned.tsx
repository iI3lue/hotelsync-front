"use client";

import { useEffect, useRef, useState } from "react";
import { me } from "@/lib/auth-client";
import { useBookingPoints } from "@/lib/use-booking-points";
import { projectedPoints, TIER_COLORS, tierLabel } from "@/lib/loyalty-tiers";
import { useToast } from "@/components/Toast";

function StarBadge({ tier }: { tier: string | null }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
        TIER_COLORS[tier ?? "silver"] ?? TIER_COLORS.silver
      }`}
      aria-hidden="true"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5l2.9 6.06 6.6.86-4.86 4.62 1.24 6.46L12 17.4l-5.88 3.1 1.24-6.46L2.5 9.42l6.6-.86L12 2.5z" />
      </svg>
    </span>
  );
}

/**
 * Puntos de fidelización de una reserva recién pagada: sondea la
 * acreditación, notifica por toast con los colores del nivel y, si el
 * evento tarda, muestra la proyección en vez de quedarse esperando.
 * Sin sesión iniciada no se renderiza (los guests no acumulan puntos).
 */
export default function PointsEarned({
  bookingId,
  amount,
  active,
  className = "",
}: {
  bookingId: string;
  amount: number;
  active: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    let on = true;
    me()
      .then((profile) => {
        if (on) setHasSession(Boolean(profile));
      })
      .catch(() => {
        if (on) setHasSession(false);
      });
    return () => {
      on = false;
    };
  }, [active]);

  const show = active && hasSession === true;
  const state = useBookingPoints(show ? bookingId : null, show);

  useEffect(() => {
    if (!show || state.status !== "settled" || notifiedRef.current) return;
    notifiedRef.current = true;
    const tier = state.tier as "silver" | "gold" | "platinum" | null;
    toast({
      type: state.reversed ? "info" : "success",
      title: state.reversed
        ? `Se revirtieron ${state.points} puntos`
        : `¡Ganaste +${state.points} puntos!`,
      message: state.reversed
        ? "La reserva se canceló y sus puntos volvieron atrás."
        : `Fidelización HotelSync${state.tier ? ` · nivel ${tierLabel(state.tier)}` : ""}`,
      accent: state.reversed ? undefined : tier ?? undefined,
      duration: state.reversed ? 6000 : 8000,
    });
  }, [show, state, toast]);

  if (!show) return null;

  if (state.status === "polling") {
    return (
      <div className={`flex items-center gap-3 ${className}`} aria-live="polite">
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-brand-gold" aria-hidden="true" />
        <p className="text-[0.875rem] text-brand-navy/60 dark:text-white/55">
          Sumando tus puntos de fidelización…
        </p>
      </div>
    );
  }

  if (state.status === "settled") {
    const tier = TIER_COLORS[state.tier ?? "silver"] ?? TIER_COLORS.silver;
    return (
      <div className={`flex items-center gap-4 ${className}`} aria-live="polite">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${tier}`}
          aria-hidden="true"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.5l2.9 6.06 6.6.86-4.86 4.62 1.24 6.46L12 17.4l-5.88 3.1 1.24-6.46L2.5 9.42l6.6-.86L12 2.5z" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-display text-[1.5rem] leading-none tabular-nums text-brand-navy dark:text-white">
            {state.reversed ? "−" : "+"}
            {state.points}{" "}
            <span className="font-sans text-sm text-brand-navy/50 dark:text-white/45">pts</span>
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-brand-navy/55 dark:text-white/50">
            {state.reversed
              ? "Reserva cancelada: sus puntos fueron revertidos."
              : `Nivel ${tierLabel(state.tier)} · ya están acreditados en tu cuenta.`}
          </p>
        </div>
      </div>
    );
  }

  const estimate = projectedPoints(amount, state.baseTier);
  return (
    <div className={`flex items-center gap-4 ${className}`} aria-live="polite">
      <StarBadge tier={state.baseTier} />
      <div className="min-w-0">
        <p className="font-display text-[1.5rem] leading-none tabular-nums text-brand-navy dark:text-white">
          ≈ {estimate}{" "}
          <span className="font-sans text-sm text-brand-navy/50 dark:text-white/45">pts</span>
        </p>
        <p className="mt-1.5 text-[0.8125rem] text-brand-navy/55 dark:text-white/50">
          Se acreditan en unos segundos{state.baseTier ? ` (nivel ${tierLabel(state.baseTier)})` : ""} —
          mirá tu cuenta de fidelización.
        </p>
      </div>
    </div>
  );
}
