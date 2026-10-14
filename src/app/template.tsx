/**
 * Transición suave entre páginas: cada navegación re-monta el template
 * y el contenido entra con un fundido corto.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
