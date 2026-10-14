// src/components/LoyaltyCard.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getLoyaltyLevels,
  getMyLoyalty,
  redeemLoyaltyPoints,
  type LoyaltyTierLevel,
  type MyLoyaltyResponse,
} from "../lib/api-loyalty";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/Toast";

const TIER_COLORS: Record<string, string> = {
  silver: "border-brand-navy/25 text-brand-navy/70 dark:border-white/30 dark:text-white/70",
  gold: "border-brand-gold text-brand-gold",
  platinum: "border-brand-navy bg-brand-navy text-white dark:border-white dark:bg-white dark:text-brand-navy",
};

const TIER_LABELS: Record<string, string> = {
  silver: "Plata",
  gold: "Oro",
  platinum: "Platino",
};

const NEXT_TIER: Record<string, { name: string; min: number }> = {
  silver: { name: "Oro", min: 1000 },
  gold: { name: "Platino", min: 5000 },
  platinum: { name: "Máximo", min: 5000 },
};

export function LoyaltyCard() {
  const { success, error: toastError } = useToast();
  const [data, setData] = useState<MyLoyaltyResponse | null>(null);
  const [levels, setLevels] = useState<LoyaltyTierLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loyalty, tiers] = await Promise.all([
        getMyLoyalty(),
        getLoyaltyLevels(),
      ]);
      setData(loyalty);
      setLevels(tiers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la fidelización"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRedeem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRedeemError(null);
    const amount = Number(points);
    if (!Number.isInteger(amount) || amount <= 0) {
      setRedeemError("Ingresá una cantidad entera mayor a cero.");
      return;
    }
    if (data && amount > data.account.points_balance) {
      setRedeemError("No tenés saldo suficiente para ese canje.");
      return;
    }
    if (reason.trim().length < 5) {
      setRedeemError("El motivo necesita al menos 5 caracteres.");
      return;
    }
    setRedeeming(true);
    try {
      await redeemLoyaltyPoints(amount, reason.trim());
      setPoints("");
      setReason("");
      success("Puntos canjeados");
      setData(await getMyLoyalty());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo canjear";
      setRedeemError(msg);
      toastError("No se pudo canjear", msg);
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner label="Cargando fidelización…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300"
      >
        <p>{error ?? "No se pudo cargar la fidelización."}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="btn-primary mt-4"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { account, recent_transactions } = data;
  const tierInfo = NEXT_TIER[account.tier];
  const progress =
    account.tier === "platinum"
      ? 100
      : Math.min(100, (account.points_balance / tierInfo.min) * 100);

  return (
    <div className="overflow-hidden border border-brand-navy/10 bg-white dark:border-white/10 dark:bg-brand-navy-800">
      <div className="p-6 border-b border-brand-navy/10 dark:border-white/10 flex justify-between items-center">
        <div>
          <h2 className="font-display text-[1.6rem] leading-tight text-brand-navy dark:text-white">
            Mi Fidelización
          </h2>
          <p className="text-sm text-brand-navy/55 dark:text-white/50">
            Acumula puntos con cada estadía
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full border text-[0.6875rem] font-medium uppercase tracking-[0.14em] ${TIER_COLORS[account.tier]}`}
        >
          {TIER_LABELS[account.tier] ?? account.tier}
        </span>
      </div>

      <div className="p-6 space-y-8">
        <div>
          <p className="font-display text-[3rem] leading-none tabular-nums text-brand-navy dark:text-white">
            {account.points_balance.toLocaleString()}{" "}
            <span className="ml-1 font-sans text-base text-brand-navy/50 dark:text-white/45">pts</span>
          </p>

          {account.tier !== "platinum" && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-brand-navy/55 dark:text-white/50 mb-1">
                <span>Progreso hacia {tierInfo.name}</span>
                <span>{tierInfo.min.toLocaleString()} pts</span>
              </div>
              <div className="h-1 w-full bg-brand-stone dark:bg-white/10">
                <div
                  className="h-1 bg-brand-gold transition-all duration-700 ease-silk"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {levels.length > 0 && (
          <div>
            <h3 className="eyebrow mb-4">
              Niveles
            </h3>
            <ul className="divide-y divide-brand-navy/10 dark:divide-white/10 border border-brand-navy/10 dark:border-white/10 overflow-hidden">
              {levels.map((level) => {
                const isCurrent = level.name === account.tier;
                return (
                  <li
                    key={level.name}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                      isCurrent
                        ? "bg-brand-paper text-brand-navy dark:bg-white/5 dark:text-white"
                        : "text-brand-navy/70 dark:text-white/65"
                    }`}
                  >
                    <span>
                      {TIER_LABELS[level.name] ?? level.name}
                      {isCurrent && (
                        <span className="ml-2 text-eyebrow uppercase text-brand-gold">
                          Tu nivel
                        </span>
                      )}
                    </span>
                    <span>
                      ×{level.multiplier} · desde{" "}
                      {level.min_balance.toLocaleString()} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div>
          <h3 className="eyebrow mb-4">
            Canjear puntos
          </h3>
          {redeemError && (
            <p
              role="alert"
              className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-950/20 dark:text-red-300"
            >
              {redeemError}
            </p>
          )}
          <form onSubmit={handleRedeem} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="loyalty-points" className="sr-only">
              Puntos a canjear
            </label>
            <input
              id="loyalty-points"
              type="number"
              min={1}
              step={1}
              max={account.points_balance}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Puntos"
              className="input-field sm:w-36"
              required
            />
            <label htmlFor="loyalty-reason" className="sr-only">
              Motivo del canje
            </label>
            <input
              id="loyalty-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo (mín. 5 caracteres)"
              maxLength={200}
              className="input-field flex-1"
              required
            />
            <button
              type="submit"
              disabled={redeeming || account.points_balance <= 0}
              className="btn-primary justify-center"
            >
              {redeeming ? <Spinner label="Canjeando…" /> : "Canjear"}
            </button>
          </form>
        </div>

        <div>
          <h3 className="eyebrow mb-4">
            Actividad Reciente
          </h3>
          {recent_transactions.length === 0 ? (
            <p className="text-sm text-brand-navy/55 dark:text-white/50 italic">
              No hay transacciones aún.
            </p>
          ) : (
            <ul className="space-y-3">
              {recent_transactions.slice(0, 5).map((tx) => (
                <li
                  key={tx.transaction_id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-brand-navy/70 dark:text-white/65">
                    {tx.reason}
                  </span>
                  <span
                    className={`font-medium ${
                      tx.type === "earn" ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
                    }`}
                  >
                    {tx.type === "earn" ? "+" : "-"}
                    {tx.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
