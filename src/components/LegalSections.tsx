import type { ReactNode } from "react";

/**
 * Bloques de texto para las páginas legales (términos y privacidad):
 * titular serif, cuerpo con ancho de lectura cómodo y viñetas en forma de
 * rombo, en sintonía con el mark de la marca.
 */
export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-28">
      <h2
        id={id}
        className="font-display text-[1.5rem] leading-tight text-brand-navy dark:text-white"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-brand-navy/70 dark:text-white/65">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          className="relative pl-6 before:absolute before:left-0 before:top-[0.58em] before:h-1.5 before:w-1.5 before:rotate-45 before:bg-brand-gold before:content-['']"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
