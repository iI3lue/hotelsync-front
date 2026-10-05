"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assignCleaningTask,
  fetchHotelTasks,
  fetchMyTasks,
  transitionCleaningTask,
  type CleaningTask,
} from "@/lib/api-client";
import { me } from "@/lib/auth-client";

const inputClass =
  "rounded border border-gray-300 bg-white px-3 py-2 text-sm touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100";

function TaskRow({
  task,
  onAction,
  busy,
}: {
  task: CleaningTask;
  onAction: (task: CleaningTask, action: "start" | "complete" | "assign") => void;
  busy: string | null;
}) {
  const [assignee, setAssignee] = useState("");
  const loading = busy === task.history_id;

  return (
    <li className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 break-words">
        <span className="font-medium">Hab. {task.room_number}</span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold dark:bg-gray-700">
          {task.status}
        </span>
        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
          {task.booking_id.slice(0, 8)}…
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {task.status !== "done" && task.status !== "cancelled" ? (
          <>
            {task.status === "assigned" ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => onAction(task, "start")}
                className="rounded border border-gray-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? "Procesando…" : "Empezar"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => onAction(task, "complete")}
              className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
            >
              {loading ? "Procesando…" : "Completar"}
            </button>
          </>
        ) : null}
        {task.status === "pending" ? (
          <span className="flex flex-wrap items-center gap-2">
            <label htmlFor={`assign-${task.history_id}`} className="sr-only">
              UUID del personal
            </label>
            <input
              id={`assign-${task.history_id}`}
              type="text"
              placeholder="UUID personal"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={`${inputClass} w-40 font-mono text-xs`}
            />
            <button
              type="button"
              disabled={loading || !assignee.trim()}
              onClick={() => {
                (task as CleaningTask & { draftAssignee?: string }).draftAssignee =
                  assignee.trim();
                onAction(task, "assign");
              }}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50"
            >
              Asignar
            </button>
          </span>
        ) : null}
      </div>
    </li>
  );
}

export default function HousekeepingBoard({
  params,
}: {
  params: Promise<{ hotel_id?: string }>;
}) {
  const [hotelId, setHotelId] = useState("");
  const [mine, setMine] = useState<CleaningTask[] | null>(null);
  const [hotel, setHotel] = useState<CleaningTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void params.then((p) => {
      if (p.hotel_id) {
        setHotelId(p.hotel_id);
        return;
      }
      void me().then((profile) => setHotelId(profile?.hotel_id ?? ""));
    });
  }, [params]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [myTasks, hotelTasks] = await Promise.all([
        fetchMyTasks().catch(() => [] as CleaningTask[]),
        hotelId
          ? fetchHotelTasks(hotelId).catch(() => [] as CleaningTask[])
          : Promise.resolve([] as CleaningTask[]),
      ]);
      setMine(myTasks);
      setHotel(hotelTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar");
    }
  }, [hotelId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAction = async (
    task: CleaningTask,
    action: "start" | "complete" | "assign"
  ) => {
    setBusy(task.history_id);
    setError(null);
    try {
      if (action === "assign") {
        const draft = (task as CleaningTask & { draftAssignee?: string }).draftAssignee;
        if (!draft) return;
        await assignCleaningTask(task.history_id, draft);
      } else {
        await transitionCleaningTask(task.history_id, action);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "La acción falló");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Limpieza</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
        {hotelId
          ? `Hotel ${hotelId.slice(0, 8)}… · tus tareas y la cola del hotel.`
          : "Elegí un hotel con ?hotel_id= para ver su cola."}{" "}
        Requiere sesión de limpieza o manager.
      </p>

      {error ? (
        <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <h2 className="mb-3 text-xl font-semibold">Mis tareas</h2>
      {!mine ? (
        <p role="status" className="text-gray-500 dark:text-gray-400">Cargando…</p>
      ) : mine.length === 0 ? (
        <p className="mb-6 rounded-lg bg-white p-4 text-sm text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
          No tenés tareas asignadas.
        </p>
      ) : (
        <ul className="mb-8 space-y-4">
          {mine.map((t) => (
            <TaskRow key={t.history_id} task={t} onAction={handleAction} busy={busy} />
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-xl font-semibold">Cola del hotel</h2>
      {!hotel ? (
        <p role="status" className="text-gray-500 dark:text-gray-400">Cargando…</p>
      ) : hotel.length === 0 ? (
        <p className="rounded-lg bg-white p-4 text-sm text-gray-500 shadow dark:bg-gray-800 dark:text-gray-400">
          Sin tareas para este hotel.
        </p>
      ) : (
        <ul className="space-y-4">
          {hotel.map((t) => (
            <TaskRow key={t.history_id} task={t} onAction={handleAction} busy={busy} />
          ))}
        </ul>
      )}
    </div>
  );
}
