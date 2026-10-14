/** Flecha fina usada en CTAs editoriales. */
export default function Arrow({ className = "h-3 w-5", direction = "right" }: { className?: string; direction?: "right" | "left" | "down" }) {
  const rot = direction === "left" ? "rotate-180" : direction === "down" ? "rotate-90" : "";
  return (
    <svg aria-hidden="true" viewBox="0 0 20 12" fill="none" stroke="currentColor" strokeWidth={1.1} className={`${className} ${rot}`}>
      <path d="M0 6h19M13.5 0.8L19 6l-5.5 5.2" />
    </svg>
  );
}
