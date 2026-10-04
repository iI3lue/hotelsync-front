"use client";

import { useEffect, useState } from "react";
import {
  fetchCleaningTasks,
  fetchRoomStatus,
  type HousekeepingTask,
} from "@/lib/api-client";
import Spinner from "@/components/Spinner";

type HkState =
  | { status: "loading" }
  | {
      status: "ready";
      roomStatus: string | null;
      task: HousekeepingTask | null;
    }
  | { status: "error"; message: string };

const MAX_ATTEMPTS = 6;
const RETRY_MS = 2000;

const ROOM_LABELS: Record<string, string> = {
  dirty: "Sucia",
  cleaning: "En limpieza",
  clean: "Limpia",
  maintenance: "Mantenimiento",
};

const TASK_LABELS: Record<string, string> = {
  pending: "Pendiente",
  assigned: "Asignada",
  in_progress: "En curso",
  done: "Hecha",
  cancelled: "Cancelada",
};

/**
 * Estado de housekeeping tras el check-out (demo de housekeeping).
 * Muestra la habitación física y la tarea que crea el consumer de
 * `checkout.completed`. Solo lectura.
 */
export default function HousekeepingStatus({
  hotelId,
  roomNumber,
  bookingId,
}: {
  hotelId: string;
  roomNumber: string;
  bookingId: string;
}) {
  const [state, setState] = useState<HkState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const load = async () => {
      for (let attempt = 1; ; attempt += 1) {
        try {
          const [rooms, tasks] = await Promise.all([
            fetchRoomStatus(hotelId),
            fetchCleaningTasks(hotelId),
          ]);
          if (cancelled) return;
          const room = rooms.find((r) => r.room_number === roomNumber) ?? null;
          const task = tasks.find((t) => t.booking_id === bookingId) ?? null;
          if (task || attempt >= MAX_ATTEMPTS) {
            setState({
              status: "ready",
              roomStatus: room?.status ?? null,
              task,
            });
            return;
          }
        } catch (err) {
          if (cancelled) return;
          if (attempt >= MAX_ATTEMPTS) {
            setState({
              status: "error",
              message:
                err instanceof Error
                  ? err.message
                  : "No se pudo cargar el estado de housekeeping",
            });
            return;
          }
        }
        await sleep(RETRY_MS);
        if (cancelled) return;
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [hotelId, roomNumber, bookingId]);

  if (state.status === "loading") {
    return (
      <p role="status" className="text-sm text-gray-600 dark:text-gray-300">
        <Spinner label="Consultando housekeeping…" /> Buscando habitación y tarea…
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
        {state.message}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-lg font-semibold">
        Housekeeping · Hab. {roomNumber}
      </h3>
      <dl className="space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium">Estado de la habitación:</dt>
          <dd>
            {state.roomStatus
              ? (ROOM_LABELS[state.roomStatus] ?? state.roomStatus)
              : "todavía no registrada"}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium">Tarea de limpieza:</dt>
          <dd>
            {state.task
              ? (TASK_LABELS[state.task.status] ?? state.task.status)
              : "todavía no creada (el evento va en camino)"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
