/** Botón de Google con el look oficial de Google; visible solo si el servidor pasa googleEnabled. */
export default function GoogleButton({ returnTo }: { returnTo: string }) {
  return (
    <a
      href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}
      className="inline-flex w-full touch-manipulation items-center justify-center gap-3 rounded-[2px] border border-[#DADCE0] bg-white px-4 py-3 text-[0.95rem] font-medium text-[#3C4043] transition-colors duration-200 hover:bg-[#F8FAFD] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-gold dark:border-[#8E918F] dark:bg-[#131314] dark:text-[#E3E3E3] dark:hover:bg-[#1F1F1F]"
    >
      <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.3 3.5 2.7.2.1c2.2-2 3.6-5 3.6-9.1z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.2.1-3.6 2.8-.1.2C3.3 21.3 7.3 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.3-3.5-2.7-.1.1C.5 8.7 0 10.2 0 12s.5 3.3 1.5 4.6l3.7-2.2z"
        />
        <path
          fill="#EA4335"
          d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.2-3.1C16.9 1.1 14.7 0 12 0 7.3 0 3.3 2.7 1.5 6.6l3.7 2.9c1-2.9 3.7-4.8 6.8-4.8z"
        />
      </svg>
      Continuar con Google
    </a>
  );
}
