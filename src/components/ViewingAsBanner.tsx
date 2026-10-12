"use client";

import { VIEW_AS_LABELS, type ViewAsRole } from "@/lib/view-as";

interface ViewingAsBannerProps {
  viewAs: ViewAsRole;
  onExit: () => void;
}

/**
 * Indicador persistente de simulación visual, con salida en un clic.
 * La preferencia vive solo en el cliente (localStorage versionado).
 */
export default function ViewingAsBanner({ viewAs, onExit }: ViewingAsBannerProps) {
  return (
    <div
      role="status"
      className="border-b border-brand-gold/30 bg-brand-gold/10 dark:bg-brand-gold/15"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5">
        <p className="text-xs font-semibold text-brand-navy dark:text-brand-gold">
          Viendo como {VIEW_AS_LABELS[viewAs]} — solo cambia lo que ves,
          tus permisos reales no cambian.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 rounded-lg border border-brand-gold/40 px-2.5 py-1 text-xs font-bold text-brand-navy transition-colors hover:bg-brand-gold/20 dark:text-brand-gold"
        >
          Volver a Super Admin
        </button>
      </div>
    </div>
  );
}
