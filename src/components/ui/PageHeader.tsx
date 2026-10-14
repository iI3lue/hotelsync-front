import Breadcrumbs from "@/components/Breadcrumbs";

interface Crumb { label: string; href?: string }

/**
 * Encabezado editorial para páginas internas: miga de pan, etiqueta,
 * titular que sube línea a línea y bajada opcional.
 */
export default function PageHeader({
  crumbs,
  eyebrow,
  title,
  lead,
  aside,
}: {
  crumbs?: Crumb[];
  eyebrow?: string;
  title: string;
  lead?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <header className="shell pb-12 pt-12 md:pb-16 md:pt-20">
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="mt-10 grid gap-8 border-b border-brand-navy/12 pb-12 dark:border-white/12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          {eyebrow && <p className="eyebrow animate-fade-in">{eyebrow}</p>}
          <h1 className={`font-display text-display-md text-brand-navy dark:text-white ${eyebrow ? "mt-4" : ""}`}>
            <span className="mask-line"><span>{title}</span></span>
          </h1>
          {lead && (
            <div className="mt-5 max-w-xl animate-fade-in text-[1rem] leading-relaxed text-brand-navy/60 dark:text-white/55" style={{ animationDelay: "250ms" }}>
              {lead}
            </div>
          )}
        </div>
        {aside && <div className="animate-fade-in" style={{ animationDelay: "350ms" }}>{aside}</div>}
      </div>
    </header>
  );
}
