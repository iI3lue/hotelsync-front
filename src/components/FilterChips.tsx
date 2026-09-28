"use client";

interface FilterChipsProps {
  active: string[];
  onToggle: (amenity: string) => void;
  onClear: () => void;
}

export const QUICK_FILTERS = ["wifi", "piscina", "desayuno", "vista al mar"];

export default function FilterChips({ active, onToggle, onClear }: FilterChipsProps) {
  const normalized = new Set(active.map((a) => a.toLowerCase()));
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros rápidos">
      {QUICK_FILTERS.map((filter) => {
        const isActive = normalized.has(filter);
        return (
          <button
            key={filter}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(filter)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
              isActive
                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {isActive ? `${filter} ✕` : filter}
          </button>
        );
      })}
      {active.length > 0 ? (
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-blue-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
