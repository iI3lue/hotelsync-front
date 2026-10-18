"use client";

import { useCallback, useEffect, useState } from "react";
import {
  assignCleaningTask,
  fetchHotels,
  fetchHotelTasks,
  fetchMyTasks,
  transitionCleaningTask,
  type CleaningTask,
  type StaffMember,
} from "@/lib/api-client";
import { me } from "@/lib/auth-client";
import type { Hotel } from "@/lib/api";
import { useStaffNames } from "@/lib/use-staff-names";

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "assigned":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "done":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    default:
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
  }
}

function TaskRow({
  task,
  onAction,
  busy,
  canAssign,
  staffOptions,
  staffNames,
  myUserId,
  myName,
}: {
  task: CleaningTask;
  onAction: (task: CleaningTask, action: "start" | "complete" | "assign") => void;
  busy: string | null;
  canAssign: boolean;
  staffOptions: StaffMember[];
  staffNames: Record<string, string>;
  myUserId: string | null;
  myName: string | null;
}) {
  const [assignee, setAssignee] = useState("");
  const loading = busy === task.history_id;
  // La fuente de verdad del asignado es `assigned_to_user_id` (UUID); el
  // nombre se resuelve contra el listado de camaristas del hotel.
  const assigneeId = task.assigned_to_user_id ?? null;
  const assigneeName = assigneeId
    ? staffNames[assigneeId] ?? (assigneeId === myUserId ? myName : null)
    : null;

  return (
    <li className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-base font-bold text-brand-navy dark:text-white">
              Habitación {task.room_number}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider border ${statusBadge(
                task.status
              )}`}
            >
              {task.status}
            </span>
            <span className="font-mono text-xs text-gray-400">
              Reserva: {task.booking_id.slice(0, 8)}…
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {assigneeName
              ? `Asignada a: ${assigneeName}`
              : "Sin camarista asignado aún"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
          {task.status !== "done" && task.status !== "cancelled" ? (
            <>
              {task.status === "assigned" ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onAction(task, "start")}
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-300 px-3.5 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                >
                  {loading ? "Procesando…" : "Empezar limpieza"}
                </button>
              ) : null}
              <button
                type="button"
                disabled={loading}
                onClick={() => onAction(task, "complete")}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Procesando…" : "Completar"}
              </button>
            </>
          ) : null}

          {canAssign && task.status === "pending" ? (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`assign-${task.history_id}`} className="sr-only">
                Camarista
              </label>
              <select
                id={`assign-${task.history_id}`}
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                disabled={loading || staffOptions.length === 0}
                className="h-9 w-48 rounded-xl border border-gray-300 bg-gray-50/50 px-2.5 text-xs text-gray-900 transition-colors focus:border-brand-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30 disabled:opacity-60 dark:border-white/10 dark:bg-brand-navy-900 dark:text-white"
              >
                <option value="">
                  {staffOptions.length === 0 ? "Sin camaristas" : "Elegí camarista…"}
                </option>
                {staffOptions.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={loading || !assignee}
                onClick={() => {
                  (task as CleaningTask & { draftAssignee?: string }).draftAssignee =
                    assignee;
                  onAction(task, "assign");
                }}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-brand-navy px-3.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-navy-900 active:scale-95 disabled:opacity-50 dark:bg-brand-gold dark:text-brand-navy dark:hover:bg-brand-gold-dark"
              >
                Asignar
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function HousekeepingBoard({
  params,
}: {
  params: Promise<{ hotel_id?: string }>;
}) {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string | null>(null);
  const [mine, setMine] = useState<CleaningTask[] | null>(null);
  const [hotel, setHotel] = useState<CleaningTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const isHousekeeper = myRole === "HOUSEKEEPER";
  // Solo manager/super admin pueden asignar (el backend exige MANAGER).
  const canAssign = myRole === "MANAGER" || myRole === "SUPER_ADMIN";
  const { list: staffOptions, names: staffNames } = useStaffNames(
    canAssign ? hotelId : ""
  );

  useEffect(() => {
    let cancelled = false;
    void me().then((profile) => {
      if (cancelled) return;
      const role = profile?.role ?? null;
      setMyRole(role);
      setMyUserId(profile?.user_id ?? null);
      setMyName(profile?.name ?? null);
      if (role === "HOUSEKEEPER") {
        // El housekeeper solo opera su hotel asignado: no se expone el
        // catálogo completo y se ignora cualquier ?hotel_id= manipulado
        // (el backend lo revalida con 403).
        if (!profile?.hotel_id) {
          setHotels([]);
          return;
        }
        setHotelId(profile.hotel_id);
        fetchHotels()
          .then((list) => {
            if (cancelled) return;
            const mine = list.find((h) => h.hotel_id === profile.hotel_id);
            setHotels(mine ? [mine] : []);
          })
          .catch(() => {
            if (!cancelled) setHotels([]);
          });
        return;
      }
      fetchHotels()
        .then((list) => {
          if (cancelled) return;
          setHotels(list);
          setHotelId(
            (current) => current || profile?.hotel_id || list[0]?.hotel_id || ""
          );
        })
        .catch(() => {
          if (!cancelled) setHotels([]);
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Se espera al perfil: el ?hotel_id= se ignora para HOUSEKEEPER.
    if (myRole === null || myRole === "HOUSEKEEPER") return;
    void params.then((p) => {
      if (p.hotel_id) setHotelId(p.hotel_id);
    });
  }, [params, myRole]);

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

  const selectedHotel = hotels.find((h) => h.hotel_id === hotelId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-3xl">
              Panel de Limpieza
            </h1>
            <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-semibold text-brand-gold">
              Housekeeping
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {selectedHotel
              ? `Operando en ${selectedHotel.name}`
              : "Gestión de habitaciones y estado de limpieza"}
          </p>
        </div>

        {/* Hotel selector (solo manager/super admin; el housekeeper ve su hotel fijo) */}
        {!isHousekeeper && hotels.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="housekeeping-hotel-select" className="sr-only">
              Cambiar hotel
            </label>
            <select
              id="housekeeping-hotel-select"
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm font-medium text-gray-900 transition-colors focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:border-white/10 dark:bg-brand-navy-800 dark:text-white"
            >
              {hotels.map((h) => (
                <option key={h.hotel_id} value={h.hotel_id}>
                  {h.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load()}
              title="Recargar tareas"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-brand-navy-800 dark:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
        {isHousekeeper && hotelId && (
          <div className="flex items-center gap-2">
            <p className="flex h-10 items-center rounded-xl border border-gray-200 bg-brand-cream-700 px-3 text-sm font-medium text-brand-navy dark:border-white/10 dark:bg-brand-navy dark:text-gray-50">
              {hotels[0]?.name ?? "Mi hotel asignado"}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              title="Recargar tareas"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-600 transition-colors hover:bg-gray-50 active:scale-95 dark:border-white/10 dark:bg-brand-navy-800 dark:text-gray-300"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isHousekeeper && !hotelId ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">
            Tu cuenta no tiene un hotel asignado. Pedile a tu manager que revise tu
            asignación antes de operar limpieza.
          </p>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
          <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="font-medium">{error}</p>
        </div>
      ) : null}

      {/* Mis tareas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-brand-navy dark:text-white">
              Mis tareas asignadas
            </h2>
            {mine && (
              <span className="rounded-full bg-brand-gold/15 px-2 py-0.5 text-xs font-bold text-brand-gold">
                {mine.length}
              </span>
            )}
          </div>
        </div>

        {!mine ? (
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-brand-navy-800">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando mis tareas…</p>
          </div>
        ) : mine.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/10 dark:bg-brand-navy-800/40 dark:text-gray-400">
            No tenés tareas personales asignadas en este momento.
          </div>
        ) : (
          <ul className="space-y-3">
            {mine.map((t) => (
              <TaskRow
                key={t.history_id}
                task={t}
                onAction={handleAction}
                busy={busy}
                canAssign={canAssign}
                staffOptions={staffOptions}
                staffNames={staffNames}
                myUserId={myUserId}
                myName={myName}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Cola del hotel */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-brand-navy dark:text-white">
              Cola de limpieza del hotel
            </h2>
            {hotel && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600 dark:bg-white/10 dark:text-gray-300">
                {hotel.length}
              </span>
            )}
          </div>
        </div>

        {!hotel ? (
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-brand-navy-800">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-gold border-t-transparent" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Cargando cola del hotel…</p>
          </div>
        ) : hotel.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-sm text-gray-500 backdrop-blur-sm dark:border-white/10 dark:bg-brand-navy-800/40 dark:text-gray-400">
            Todas las habitaciones de este hotel se encuentran al día.
          </div>
        ) : (
          <ul className="space-y-3">
            {hotel.map((t) => (
              <TaskRow
                key={t.history_id}
                task={t}
                onAction={handleAction}
                busy={busy}
                canAssign={canAssign}
                staffOptions={staffOptions}
                staffNames={staffNames}
                myUserId={myUserId}
                myName={myName}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
