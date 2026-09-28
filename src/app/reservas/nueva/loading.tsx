/**
 * Skeleton instantáneo para la página de reserva: feedback inmediato
 * mientras el servidor resuelve tipos de habitación y formularios.
 */
export default function Loading() {
  return (
    <div aria-hidden="true">
      <div className="mb-4 h-4 w-40 rounded bg-gray-200 text-sm dark:bg-gray-700" />
      <div className="mb-2 h-8 w-56 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mb-8 h-4 w-full max-w-2xl rounded bg-gray-200 dark:bg-gray-700" />
      <div className="animate-pulse rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="mb-4 h-5 w-56 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-4 h-10 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-4 h-72 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-9 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
