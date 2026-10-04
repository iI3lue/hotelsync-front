import AdminAuthLink from "@/components/AdminAuthLink";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const linkClass =
    "rounded px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-200 dark:hover:text-blue-400";
  return (
    <div>
      <nav
        aria-label="Administración"
        className="mb-6 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800"
      >
        <span className="mr-1 rounded bg-gray-800 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white dark:bg-gray-950">
          Admin
        </span>
        <a href="/admin" className={linkClass}>
          Panel
        </a>
        <a href="/admin/hotels" className={linkClass}>
          Hoteles
        </a>
        <a href="/admin/recepcion" className={linkClass}>
          Recepción
        </a>
        <a href="/admin/housekeeping" className={linkClass}>
          Limpieza
        </a>
        <a href="/" className={linkClass}>
          ← Volver al sitio
        </a>
        <AdminAuthLink linkClass={linkClass} />
      </nav>
      {children}
      <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
        Zona administrativa sin autenticación por alcance académico (pedido del profesor: front único).
        TODO: middleware con roles antes de producción.
      </p>
    </div>
  );
}
