import Link from "next/link";
import { fetchHotels } from "@/lib/api";
import LogoMark from "@/components/LogoMark";

const COLS = [
  {
    title: "Explorar",
    links: [
      { href: "/", label: "Inicio" },
      { href: "/buscar", label: "Hoteles y destinos" },
      { href: "/reservas/nueva", label: "Reservar una estancia" },
    ],
  },
  {
    title: "Tu cuenta",
    links: [
      { href: "/cuenta/entrar", label: "Entrar" },
      { href: "/cuenta/crear", label: "Crear cuenta" },
      { href: "/mis-reservas", label: "Mis reservas" },
    ],
  },
];

async function Destinations() {
  const hotels = await fetchHotels().catch(() => []);
  const seen = new Set<string>();
  const cities = hotels.filter((h) => {
    const k = h.city.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (cities.length === 0) return null;
  return (
    <div>
      <h3 className="text-eyebrow uppercase text-white/45">Destinos</h3>
      <ul className="mt-5 space-y-3">
        {cities.slice(0, 6).map((h) => (
          <li key={h.city}>
            <Link href={`/buscar?city=${encodeURIComponent(h.city)}`} className="text-[0.9375rem] text-white/75 transition-colors hover:text-white">
              {h.city}
              <span className="ml-2 text-xs text-white/35">{h.country}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="mt-28 bg-brand-navy-900 text-white">
      <div className="shell pb-10 pt-20">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <LogoMark className="h-11 w-11" />
            <p className="mt-6 font-display text-[2rem] leading-[1.1]">
              Estancias con carácter, reservadas directo con la casa.
            </p>
            <Link href="/buscar" className="link-line mt-8 text-white/90">
              Planificar una estancia
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {COLS.map((c) => (
              <div key={c.title}>
                <h3 className="text-eyebrow uppercase text-white/45">{c.title}</h3>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[0.9375rem] text-white/75 transition-colors hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Destinations />
            <div>
              <h3 className="text-eyebrow uppercase text-white/45">Equipo</h3>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link href="/admin" className="text-[0.9375rem] text-white/75 transition-colors hover:text-white">
                    Panel de gestión
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="mt-20 select-none overflow-hidden whitespace-nowrap text-center font-display uppercase leading-none tracking-[0.06em] text-white/[0.07]"
          style={{ fontSize: "clamp(3rem, 11.5vw, 12rem)" }}
        >
          HotelSync
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HotelSync. Todos los derechos reservados.</p>
          <nav aria-label="Enlaces legales" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/terminos" className="transition-colors hover:text-white/75">
              Términos y condiciones
            </Link>
            <Link href="/privacidad" className="transition-colors hover:text-white/75">
              Política de privacidad
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
