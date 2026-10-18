/**
 * Marca de HotelSync: rombo doble en latón sobre tinta, eco del separador
 * tipográfico del wordmark. Se usa en la barra de navegación, en el pie y
 * como base del favicon (app/icon.svg).
 */
export default function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <rect width="64" height="64" rx="14" fill="#141716" />
      <path d="M32 12 52 32 32 52 12 32Z" fill="none" stroke="#A8874F" strokeWidth="4" />
      <path d="M32 24 40 32 32 40 24 32Z" fill="#A8874F" />
    </svg>
  );
}
