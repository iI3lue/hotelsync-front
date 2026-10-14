import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Miga de pan compartida (Inicio / …): los enlaces van primero,
 * el último item sin href es la página actual.
 */
export default function Breadcrumbs({ items, tone = "default" }: { items: Crumb[]; tone?: "default" | "inverse" }) {
  const base = tone === "inverse" ? "text-white/60 hover:text-white" : "text-brand-navy/50 hover:text-brand-navy dark:text-white/50 dark:hover:text-white";
  const current = tone === "inverse" ? "text-white" : "text-brand-navy dark:text-white";
  return (
    <nav aria-label="Miga de pan" className="text-eyebrow uppercase">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <li>
          <Link href="/" className={`transition-colors ${base}`}>Inicio</Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-4 bg-current opacity-30" />
            {item.href ? (
              <Link href={item.href} className={`transition-colors ${base}`}>{item.label}</Link>
            ) : (
              <span aria-current="page" className={current}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
