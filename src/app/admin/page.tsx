import Link from "next/link";
import { fetchArrivals, fetchBookings, fetchHotelById, fetchHotels } from "@/lib/api";
import { getSessionScope } from "@/lib/server-session";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formattedToday(): string {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default async function DashboardPage() {
  const session = await getSessionScope();
  // El manager solo opera su hotel asignado.
  const isManager = session.role === "MANAGER";
  const assignedHotelId = session.hotel_id;

  let hotelsCount = 0;
  let firstHotelId = "";
  if (isManager) {
    if (assignedHotelId) {
      try {
        const assigned = await fetchHotelById(assignedHotelId);
        hotelsCount = 1;
        firstHotelId = assigned.hotel_id;
      } catch {
        hotelsCount = 0;
      }
    }
  } else {
    try {
      const hotels = await fetchHotels();
      hotelsCount = hotels.length;
      firstHotelId = hotels[0]?.hotel_id || "";
    } catch {
      hotelsCount = 0;
    }
  }

  let arrivalsToday = 0;
  let pendingCount = 0;
  if (firstHotelId) {
    const today = todayIso();
    try {
      const [arrivals, pending] = await Promise.all([
        fetchArrivals(firstHotelId, today).catch(() => []),
        fetchBookings({ hotel_id: firstHotelId, status: "pending", date: today }).catch(() => []),
      ]);
      arrivalsToday = arrivals.length;
      pendingCount = pending.length;
    } catch {
      arrivalsToday = 0;
      pendingCount = 0;
    }
  }

  const receptionHref = firstHotelId
    ? `/admin/recepcion?hotel_id=${firstHotelId}&date=${todayIso()}`
    : "/admin/recepcion";
  const housekeepingHref = firstHotelId
    ? `/admin/housekeeping?hotel_id=${firstHotelId}`
    : "/admin/housekeeping";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-brand-navy dark:text-white sm:text-3xl">
              Panel de Control General
            </h1>
            <span className="rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-semibold text-brand-gold">
              Gestión & Operaciones
            </span>
          </div>
          <p className="mt-1 text-sm capitalize text-gray-500 dark:text-gray-400">
            {formattedToday()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/hotels"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-navy px-4 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:bg-brand-navy-900 active:scale-95 dark:bg-brand-gold dark:text-brand-navy dark:hover:bg-brand-gold-dark"
          >
            + Administrar Hoteles
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Hoteles */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Hoteles Activos
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-brand-navy dark:text-white" role="status">
            {hotelsCount}
          </p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 text-xs dark:border-white/6">
            <span className="text-gray-500 dark:text-gray-400">Red hotelera</span>
            <Link href="/admin/hotels" className="font-semibold text-brand-gold hover:underline">
              Ver lista →
            </Link>
          </div>
        </div>

        {/* Llegadas Hoy */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Llegadas Hoy
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-brand-navy dark:text-white" role="status">
            {arrivalsToday}
          </p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 text-xs dark:border-white/6">
            <span className="text-gray-500 dark:text-gray-400">Front Desk</span>
            <Link href={receptionHref} className="font-semibold text-brand-gold hover:underline">
              Ir a recepción →
            </Link>
          </div>
        </div>

        {/* Pendientes */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Reservas Pendientes
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tabular-nums text-brand-navy dark:text-white" role="status">
            {pendingCount}
          </p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 text-xs dark:border-white/6">
            <span className="text-gray-500 dark:text-gray-400">Por confirmar</span>
            <Link href={`${receptionHref}&tab=reservas`} className="font-semibold text-brand-gold hover:underline">
              Revisar →
            </Link>
          </div>
        </div>

        {/* Estado Operativo */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Servicios
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              Activo
            </span>
            <span className="text-xs text-gray-500">7 microservicios</span>
          </div>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100 text-xs dark:border-white/6">
            <span className="text-gray-500 dark:text-gray-400">Sincronización</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">En línea</span>
          </div>
        </div>
      </div>

      {/* Operational Hub Cards */}
      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-brand-navy dark:text-white">
          Módulos de Operación
        </h2>

        <div className={`grid grid-cols-1 gap-4 ${isManager ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3"}`}>
          {/* Recepción */}
          <Link
            href={receptionHref}
            className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/15 text-brand-gold transition-transform group-hover:scale-105">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-brand-navy dark:text-white group-hover:text-brand-gold transition-colors">
                  Recepción & Check-in
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Entradas, salidas y asignación física
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-600 dark:text-gray-300">
              Operá el flujo de huéspedes, asigná números de habitación en tiempo real y gestioná check-outs con sincronización a eventos.
            </p>
          </Link>

          {/* Hoteles */}
          <Link
            href="/admin/hotels"
            className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 transition-transform group-hover:scale-105 dark:text-blue-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-brand-navy dark:text-white group-hover:text-brand-gold transition-colors">
                  Hoteles & Inventario
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Propiedades, tipos y tarifas
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-600 dark:text-gray-300">
              Configurá capacidades, tipos de habitación, inventario de cuartos físicos y políticas de disponibilidad en un solo lugar.
            </p>
          </Link>

          {/* Limpieza */}
          <Link
            href={housekeepingHref}
            className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-hover:scale-105 dark:text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-semibold text-brand-navy dark:text-white group-hover:text-brand-gold transition-colors">
                  Limpieza & Estado
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Cola de camaristas y habitaciones
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-gray-600 dark:text-gray-300">
              Supervisá la transición de estados de limpieza tras cada check-out, asigná camaristas y mantené el inventario habitable.
            </p>
          </Link>

          {/* Personal (solo manager: gestión de cuentas de su hotel) */}
          {isManager ? (
            <Link
              href="/admin/staff"
              className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs transition-all hover:border-brand-gold/40 hover:shadow-card dark:border-white/10 dark:bg-brand-navy-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 transition-transform group-hover:scale-105 dark:text-purple-400">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-brand-navy dark:text-white group-hover:text-brand-gold transition-colors">
                    Personal
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recepción y limpieza
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-gray-600 dark:text-gray-300">
                Creá cuentas de recepcionistas y personal de limpieza de tu hotel y gestioná sus accesos.
              </p>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
