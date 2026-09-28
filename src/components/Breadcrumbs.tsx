interface Crumb {
  label: string;
  href?: string;
}

/**
 * Miga de pan compartida (Inicio / …): los enlaces van primero,
 * el último item sin href es la página actual.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Miga de pan" className="mb-4 text-sm">
      <a href="/" className="text-blue-600 hover:underline dark:text-blue-400">
        Inicio
      </a>{" "}
      {items.map((item) => (
        <span key={item.label}>
          <span aria-hidden="true">/</span>{" "}
          {item.href ? (
            <a
              href={item.href}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              {item.label}
            </a>
          ) : (
            <span>{item.label}</span>
          )}{" "}
        </span>
      ))}
    </nav>
  );
}
