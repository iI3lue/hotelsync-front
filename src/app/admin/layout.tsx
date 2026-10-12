import AdminNav from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AdminNav />
      {children}
      <p className="mt-8 text-xs text-gray-500 dark:text-gray-400">
        Zona administrativa sin autenticación por alcance académico (pedido del profesor: front único).
        El selector "Ver como…" filtra secciones solo en pantalla; TODO: middleware con roles antes de producción.
      </p>
    </div>
  );
}
