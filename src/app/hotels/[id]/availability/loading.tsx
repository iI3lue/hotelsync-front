/**
 * Skeleton instantáneo para la página de disponibilidad: Next lo muestra
 * en cuanto se navega, mientras el servidor resuelve hotel + habitaciones.
 */
export default function Loading() {
  return (
    <div aria-hidden="true">
      <div className="mb-4 h-4 w-64 rounded bg-gray-200 text-sm dark:bg-gray-700" />
      <div className="mb-2 h-8 w-72 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-8 h-4 w-96 max-w-full rounded bg-gray-200 dark:bg-gray-700" />
      <div className="animate-pulse rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-4 h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-4 h-10 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-4 h-72 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-44 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
