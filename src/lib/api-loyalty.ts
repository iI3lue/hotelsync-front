// src/lib/api-loyalty.ts
"use client";

import { clientFetch, clientPost } from "./api-client";

export interface LoyaltyAccount {
  account_id: string;
  user_id: string;
  tier: "silver" | "gold" | "platinum";
  points_balance: number;
  created_at: string;
  updated_at: string;
}

export interface PointsTransaction {
  transaction_id: string;
  user_id: string;
  type: "earn" | "redeem" | "reverse";
  points: number;
  booking_id: string | null;
  reason: string;
  created_at: string;
}

export interface BookingPointsResponse {
  earn: PointsTransaction;
  reverse: PointsTransaction | null;
}

export interface MyLoyaltyResponse {
  account: LoyaltyAccount;
  recent_transactions: PointsTransaction[];
}

export interface LoyaltyTierLevel {
  name: string;
  multiplier: number;
  min_balance: number;
}

interface DataEnvelope<T> {
  data: T;
}

// Cuenta y transacciones del usuario logueado (el servicio crea la
// cuenta en silver/0 si todavía no existe, así que siempre es 200).
export async function getMyLoyalty(): Promise<MyLoyaltyResponse> {
  const res = await clientFetch<DataEnvelope<MyLoyaltyResponse>>(
    "/api/loyalty/me"
  );
  return res.data;
}

// Canjear puntos. POST sin reintentos (clientPost) para no duplicar el débito.
export async function redeemLoyaltyPoints(
  points: number,
  reason: string
): Promise<PointsTransaction> {
  const res = await clientPost<DataEnvelope<PointsTransaction>>(
    "/api/loyalty/me/redeem",
    { points, reason }
  );
  return res.data;
}

// Niveles y multiplicadores (público).
export async function getLoyaltyLevels(): Promise<LoyaltyTierLevel[]> {
  const res = await clientFetch<DataEnvelope<LoyaltyTierLevel[]>>(
    "/api/loyalty/levels"
  );
  return res.data;
}

// Puntos acreditados de una reserva propia (null si todavía no se acreditó).
export async function getBookingPoints(
  bookingId: string
): Promise<BookingPointsResponse | null> {
  const res = await clientFetch<DataEnvelope<BookingPointsResponse | null>>(
    `/api/loyalty/me/bookings/${bookingId}/points`
  );
  return res.data;
}
