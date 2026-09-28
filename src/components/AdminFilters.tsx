"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminFilters({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.push(qs ? `/admin/hotels?${qs}` : "/admin/hotels");
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Filtrar hoteles"
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="min-w-0 flex-1">
        <label
          htmlFor="admin-filter-q"
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          Buscar por nombre, ciudad o país
        </label>
        <input
          id="admin-filter-q"
          name="q"
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="Ej.: Bogotá, Andino, Colombia…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 touch-manipulation dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 touch-manipulation"
        >
          Filtrar
        </button>
        {initialQuery ? (
          <a
            href="/admin/hotels"
            className="rounded border border-gray-300 px-4 py-2 font-medium transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 touch-manipulation dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Limpiar
          </a>
        ) : null}
      </div>
    </form>
  );
}
