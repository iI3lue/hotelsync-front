"use client";

import { useCallback, useEffect, useState } from "react";
import type { Hotel } from "@/lib/api";
import { me } from "@/lib/auth-client";
import {
  fetchHotels,
  fetchStaff,
  createStaff,
  fetchHotelStaff,
  createHotelStaff,
  setHotelStaffActive,
  type StaffMember,
} from "@/lib/api-client";

const ROLES = ["MANAGER", "RECEPTIONIST", "HOUSEKEEPER"] as const;
/** Roles que un MANAGER puede dar de alta en su hotel (no crea managers). */
const MANAGER_ROLES = ["RECEPTIONIST", "HOUSEKEEPER"] as const;
const ROLE_LABELS: Record<string, string> = {
  MANAGER: "Manager",
  RECEPTIONIST: "Recepcionista",
  HOUSEKEEPER: "Limpieza",
};

const inputClass =
  "rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-gold/30 dark:border-white/10 dark:bg-brand-navy-800 dark:text-white dark:[color-scheme:dark]";
const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300";

function StaffTable({
  staff,
  hotels,
  myUserId,
  togglingId,
  onToggle,
}: {
  staff: StaffMember[];
  hotels: Hotel[];
  myUserId: string | null;
  togglingId: string | null;
  onToggle: (member: StaffMember) => void;
}) {
  const hotelMap = Object.fromEntries(hotels.map((h) => [h.hotel_id, h.name]));

  if (staff.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-brand-navy-800/40 dark:text-gray-400">
        No hay personal registrado todavía.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-brand-navy-800">
      <table className="w-full">
        <thead className="border-b border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-white/5">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Rol</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Hotel</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</th>
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acceso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
          {staff.map((member) => {
            const assignment = member.assignments[0];
            const hotelName = assignment?.hotel_id
              ? (hotelMap[assignment.hotel_id] ?? assignment.hotel_id.slice(0, 8) + "…")
              : "—";
            return (
              <tr key={member.user_id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                <td className="px-5 py-3.5 text-sm font-medium text-brand-navy dark:text-white">{member.name}</td>
                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{member.email}</td>
                <td className="px-5 py-3.5">
                  {assignment ? (
                    <span className="inline-flex items-center rounded-lg bg-brand-gold/10 px-2.5 py-1 text-xs font-semibold text-brand-navy dark:bg-brand-gold/15 dark:text-brand-gold">
                      {ROLE_LABELS[assignment.role] ?? assignment.role}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Sin asignación</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                  {hotelName}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${member.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-gray-500/10 text-gray-600 dark:text-gray-400"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${member.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {member.status === "ACTIVE" ? "Activo" : member.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {assignment ? (
                    <button
                      type="button"
                      disabled={togglingId === member.user_id || member.user_id === myUserId}
                      onClick={() => onToggle(member)}
                      title={
                        member.user_id === myUserId
                          ? "No podés cambiar tu propia asignación"
                          : assignment.is_active
                            ? "Desactivar asignación en este hotel"
                            : "Reactivar asignación en este hotel"
                      }
                      className="inline-flex items-center rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-40 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                    >
                      {togglingId === member.user_id
                        ? "Procesando…"
                        : assignment.is_active
                          ? "Desactivar"
                          : "Activar"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myHotelId, setMyHotelId] = useState<string | null>(null);

  const isManager = myRole === "MANAGER";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "MANAGER" as string,
    hotel_id: "",
    password: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await me().catch(() => null);
      const role = profile?.role ?? null;
      const assignedHotel = profile?.hotel_id ?? null;
      setMyRole(role);
      setMyUserId(profile?.user_id ?? null);
      setMyHotelId(assignedHotel);
      if (role === "MANAGER" && assignedHotel) {
        // El manager solo ve y gestiona el personal de su propio hotel.
        const [staffData, hotelsData] = await Promise.all([
          fetchHotelStaff(assignedHotel),
          fetchHotels().catch(() => [] as Hotel[]),
        ]);
        setStaff(staffData);
        const mine = hotelsData.find((h) => h.hotel_id === assignedHotel);
        setHotels(mine ? [mine] : []);
        setFormData((prev) => ({
          ...prev,
          role:
            prev.role === "MANAGER" ? "RECEPTIONIST" : prev.role,
          hotel_id: assignedHotel,
        }));
      } else {
        const [staffData, hotelsData] = await Promise.all([
          fetchStaff(),
          fetchHotels().catch(() => [] as Hotel[]),
        ]);
        setStaff(staffData);
        setHotels(hotelsData);
        setFormData((prev) => ({
          ...prev,
          hotel_id: prev.hotel_id || hotelsData[0]?.hotel_id || "",
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el personal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result =
        isManager && myHotelId
          ? await createHotelStaff(myHotelId, {
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase(),
              role: formData.role,
              password: formData.password || undefined,
            })
          : await createStaff({
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase(),
              role: formData.role,
              hotel_id: formData.hotel_id || undefined,
              password: formData.password || undefined,
            });
      setNotice(
        `Cuenta creada para ${result.user.name}. ${
          result.initial_password
            ? `Contraseña temporal: ${result.initial_password}`
            : "El usuario recibirá un email para activar su cuenta."
        }`
      );
      setFormData({
        name: "",
        email: "",
        role: isManager ? "RECEPTIONIST" : "MANAGER",
        hotel_id: isManager ? (myHotelId ?? "") : (hotels[0]?.hotel_id ?? ""),
        password: "",
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(member: StaffMember) {
    const assignment = member.assignments[0];
    // El manager opera sobre su hotel; el resto, sobre el hotel de la asignación.
    const hotelId = isManager ? myHotelId : assignment?.hotel_id;
    if (!assignment || !hotelId) return;
    setTogglingId(member.user_id);
    setError(null);
    setNotice(null);
    try {
      await setHotelStaffActive(hotelId, member.user_id, !assignment.is_active);
      setNotice(
        assignment.is_active
          ? `Asignación de ${member.name} desactivada (sus sesiones fueron revocadas).`
          : `Asignación de ${member.name} reactivada.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el acceso");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-3xl">Personal</h1>
            <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-semibold text-brand-gold">{isManager ? "Manager" : "Super Admin"}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isManager
              ? "Gestioná las cuentas de recepción y limpieza de tu hotel."
              : "Gestioná cuentas de personal y asigná roles por hotel."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-navy-700 active:scale-95 dark:bg-brand-gold dark:text-brand-navy dark:hover:bg-brand-gold-400"
        >
          {showForm ? "Cerrar" : "+ Nueva cuenta"}
        </button>
      </div>

      {notice && (
        <div role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          <p className="font-medium">{notice}</p>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
          <h2 className="font-display text-lg font-semibold text-brand-navy dark:text-white">Nueva cuenta de personal</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="staff-name" className={labelClass}>Nombre completo</label>
              <input id="staff-name" type="text" required value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} className={`${inputClass} w-full`} placeholder="María González" />
            </div>
            <div>
              <label htmlFor="staff-email" className={labelClass}>Email</label>
              <input id="staff-email" type="email" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className={`${inputClass} w-full`} placeholder="maria@hotelsync.com" />
            </div>
            <div>
              <label htmlFor="staff-role" className={labelClass}>Rol</label>
              <select
                id="staff-role"
                value={formData.role}
                onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                className={`${inputClass} w-full`}
              >
                {(isManager ? MANAGER_ROLES : ROLES).map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="staff-hotel" className={labelClass}>Hotel asignado</label>
              {isManager ? (
                <p className="flex h-10 w-full items-center rounded-xl border border-gray-200 bg-brand-cream-700 px-3 text-sm font-medium text-brand-navy dark:border-white/10 dark:bg-brand-navy-800 dark:text-gray-50">
                  {hotels[0]?.name ?? "Mi hotel asignado"}
                </p>
              ) : (
                <select
                  id="staff-hotel"
                  value={formData.hotel_id}
                  onChange={(e) => setFormData((p) => ({ ...p, hotel_id: e.target.value }))}
                  className={`${inputClass} w-full`}
                  required
                >
                  {hotels.map((h) => (
                    <option key={h.hotel_id} value={h.hotel_id}>{h.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="staff-password" className={labelClass}>Contraseña (opcional — si no se ingresa, se genera una temporal)</label>
              <input id="staff-password" type="password" value={formData.password} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} className={`${inputClass} w-full sm:max-w-xs`} placeholder="Mínimo 8 caracteres" minLength={8} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={busy} className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-navy px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-navy-700 active:scale-95 disabled:opacity-50 dark:bg-brand-gold dark:text-brand-navy dark:hover:bg-brand-gold-400">
              {busy ? "Creando…" : "Crear cuenta"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-100 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isManager && !myHotelId && !loading ? (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          <p className="font-medium">Tu cuenta de manager no tiene un hotel asignado. No podés gestionar personal hasta que se corrija tu asignación.</p>
        </div>
      ) : loading ? (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando personal…</p>
        </div>
      ) : (
        <StaffTable
          staff={staff}
          hotels={hotels}
          myUserId={myUserId}
          togglingId={togglingId}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
