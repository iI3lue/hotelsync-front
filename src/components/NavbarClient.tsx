"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logout, me, type AuthProfile } from "@/lib/auth-client";
import {
  useViewAs,
  type ViewAsRole,
  VIEW_AS_LABELS,
} from "@/lib/view-as";
import { defaultRouteForRole, isAllowedPathForRole } from "@/lib/routes";
import ViewAsSelector from "@/components/ViewAsSelector";
import ViewingAsBanner from "@/components/ViewingAsBanner";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/",             label: "Inicio" },
  { href: "/buscar",       label: "Hoteles y destinos" },
  { href: "/mis-reservas", label: "Mis reservas" },
];

/** Páginas que abren con fotografía a sangre: el header flota encima. */
function hasImmersiveHero(pathname: string): boolean {
  return pathname === "/" || /^\/hotels\/[^/]+$/.test(pathname);
}

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span translate="no" className={`font-display text-[1.15rem] uppercase leading-none tracking-[0.32em] sm:text-[1.3rem] ${className}`}>
      Hotel<span className="mx-[0.12em] inline-block h-[0.32em] w-[0.32em] translate-y-[-0.2em] rotate-45 border border-current opacity-70" aria-hidden="true" />Sync
    </span>
  );
}

function UserMenu({ profile, onLogout }: { profile: AuthProfile; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const initials = (profile.name || profile.email).slice(0, 2).toUpperCase();

  const item =
    "flex w-full items-center gap-3 px-5 py-2.5 text-[0.875rem] text-brand-navy/80 transition-colors hover:bg-brand-navy/[0.04] hover:text-brand-navy dark:text-white/75 dark:hover:bg-white/5 dark:hover:text-white";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Menú de ${profile.name || profile.email}`}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-current text-[0.7rem] font-medium tracking-wider transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
      >
        {profile.picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.picture_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="animate-scale-in absolute right-0 top-12 z-40 w-64 origin-top-right overflow-hidden rounded-[2px] border border-brand-navy/10 bg-white text-brand-navy shadow-elevated dark:border-white/10 dark:bg-brand-navy-800 dark:text-white">
            <div className="border-b border-brand-navy/8 px-5 py-4 dark:border-white/8">
              <p className="eyebrow">{VIEW_AS_LABELS[profile.role as ViewAsRole] ?? profile.role}</p>
              <p className="mt-1.5 truncate font-display text-lg">{profile.name || profile.email}</p>
              {profile.name && <p className="truncate text-xs text-brand-navy/50 dark:text-white/45">{profile.email}</p>}
            </div>
            <div className="py-2">
              <Link href="/cuenta/perfil" onClick={() => setOpen(false)} className={item}>Mi perfil</Link>
              <Link href="/mis-reservas" onClick={() => setOpen(false)} className={item}>Mis reservas</Link>
              {profile.role !== "GUEST" && (
                <Link href="/admin" onClick={() => setOpen(false)} className={item}>Administrar</Link>
              )}
              <div className="mx-5 my-2 h-px bg-brand-navy/8 dark:bg-white/8" />
              <button type="button" onClick={onLogout} className={`${item} text-red-700 dark:text-red-300`}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function NavbarClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const loadingRef = useRef(true);

  const loadProfile = useCallback(async () => {
    const p = await me();
    setProfile(p);
    setProfileLoading(false);
    loadingRef.current = false;
  }, []);
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { viewAs, viewedRole, setViewAs } = useViewAs(profile?.role ?? null);

  const immersive = hasImmersiveHero(pathname);
  const overlay = immersive && atTop && !mobileOpen;
  const isAdmin = pathname.startsWith("/admin");
  const isGuestView = !viewedRole || viewedRole === "GUEST" || ((viewedRole === "SUPER_ADMIN" || viewedRole === "MANAGER") && !isAdmin);

  const navLinks = (() => {
    switch (viewedRole) {
      case "RECEPTIONIST":
        return [{ href: "/admin/recepcion", label: "Recepción" }];
      case "HOUSEKEEPER":
        return [{ href: "/admin/housekeeping", label: "Limpieza" }];
      case "MANAGER":
        if (isAdmin) {
          return [
            { href: "/admin", label: "Panel" },
            { href: "/admin/hotels", label: "Hoteles" },
            { href: "/admin/staff", label: "Personal" },
            { href: "/", label: "Vista huésped" },
          ];
        }
        return [
          { href: "/", label: "Inicio" },
          { href: "/buscar", label: "Hoteles y destinos" },
          { href: "/admin", label: "Panel de gestión" },
        ];
      case "SUPER_ADMIN":
        if (isAdmin) {
          return [
            { href: "/admin", label: "Panel" },
            { href: "/admin/hotels", label: "Hoteles" },
            { href: "/admin/recepcion", label: "Recepción" },
            { href: "/admin/housekeeping", label: "Limpieza" },
            { href: "/", label: "Sitio público" },
          ];
        }
        return [...NAV_LINKS, { href: "/admin", label: "Administrar" }];
      case "GUEST":
      default:
        return NAV_LINKS;
    }
  })();

  function handleSelectRole(role: ViewAsRole | null) {
    setViewAs(role);
    const target = defaultRouteForRole(role ?? "SUPER_ADMIN");
    router.push(target);
  }

  // Revalida sin recarga manual: al montar, al volver a la pestaña o al
  // navegar, una sesión restaurada (o un backend que ya despertó)
  // actualiza el menú solo.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadProfile();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadProfile]);

  useEffect(() => {
    void loadProfile();
  }, [pathname, loadProfile]);

  useEffect(() => {
    if (loadingRef.current) return;
    if (profile || viewAs) {
      if (!isAllowedPathForRole(viewedRole, pathname)) {
        router.replace(defaultRouteForRole(viewedRole));
      }
    }
  }, [profile, viewAs, viewedRole, pathname, router]);

  // Header: transparente sobre la foto, sólido al bajar; se esconde al
  // bajar rápido y vuelve a aparecer apenas el usuario sube.
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setAtTop(y < 24);
        if (y > 320 && y > lastY + 4) setHidden(true);
        else if (y < lastY - 4 || y < 320) setHidden(false);
        lastY = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Bloquea el scroll del body con el menú móvil abierto.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
    setProfile(null);
    router.push("/");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,color,border-color] duration-500 ease-silk ${
          hidden && !mobileOpen ? "-translate-y-full" : "translate-y-0"
        } ${
          overlay
            ? "border-b border-white/15 bg-transparent text-white"
            : mobileOpen
              ? "border-b border-transparent bg-transparent text-white"
              : "border-b border-brand-navy/10 bg-brand-paper/90 text-brand-navy backdrop-blur-md dark:border-white/10 dark:bg-brand-navy-900/90 dark:text-white"
        }`}
      >
        {/* Velo superior para que el texto blanco lea sobre cualquier foto */}
        {overlay && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/45 to-transparent" />
        )}

        <div className="shell grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Izquierda: menú móvil / navegación */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              className="group -ml-2 flex h-10 items-center gap-3 px-2 lg:hidden"
            >
              <span className="relative block h-3 w-6" aria-hidden="true">
                <span className={`absolute left-0 top-0 h-px w-6 bg-current transition-transform duration-500 ease-silk ${mobileOpen ? "translate-y-1.5 rotate-45" : ""}`} />
                <span className={`absolute bottom-0 left-0 h-px bg-current transition-all duration-500 ease-silk ${mobileOpen ? "w-6 -translate-y-1.5 -rotate-45" : "w-4"}`} />
              </span>
              <span className="hidden text-[0.75rem] uppercase tracking-label sm:inline">{mobileOpen ? "Cerrar" : "Menú"}</span>
            </button>

            {profileLoading ? (
              <div aria-hidden="true" className="hidden h-3 w-56 animate-pulse rounded-full bg-current opacity-10 lg:block" />
            ) : (
              <nav aria-label="Principal" className="-ml-3 hidden items-center lg:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`nav-link px-3 py-2 ${isActive(link.href) ? "opacity-100 after:scale-x-100" : ""}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Centro: marca */}
          <Link href="/" aria-label="HotelSync — inicio" className="justify-self-center transition-opacity hover:opacity-80">
            <Wordmark />
          </Link>

          {/* Derecha: acciones */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            {profile?.role === "SUPER_ADMIN" && (
              <div className="hidden xl:block">
                <ViewAsSelector viewAs={viewAs} onSelect={handleSelectRole} />
              </div>
            )}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {profile ? (
              <UserMenu profile={profile} onLogout={handleLogout} />
            ) : profileLoading ? (
              <span aria-hidden="true" className="hidden h-9 w-9 animate-pulse rounded-full bg-current opacity-10 md:block" />
            ) : (
              <Link href="/cuenta/entrar" className="nav-link hidden px-3 py-2 md:inline-block">
                Entrar
              </Link>
            )}

            {isGuestView && (
              <Link
                href="/buscar"
                className={`ml-1 inline-flex items-center rounded-[2px] border px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-label transition-colors duration-300 sm:px-5 ${
                  overlay || mobileOpen
                    ? "border-white/70 hover:bg-white hover:text-brand-navy"
                    : "border-brand-navy bg-brand-navy text-white hover:bg-brand-navy-700 dark:border-white dark:bg-white dark:text-brand-navy dark:hover:bg-brand-stone"
                }`}
              >
                Reservar
              </Link>
            )}
          </div>
        </div>

        {viewAs && !mobileOpen && (
          <ViewingAsBanner viewAs={viewAs} onExit={() => handleSelectRole(null)} />
        )}
      </header>

      {/* Menú a pantalla completa (móvil / tablet) */}
      <div
        aria-hidden={!mobileOpen}
        className={`fixed inset-0 z-40 bg-brand-navy-900 text-white transition-[opacity,visibility] duration-500 ease-silk lg:hidden ${
          mobileOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="shell flex h-full flex-col pb-10 pt-[calc(var(--header-h)+2rem)]">
          <nav aria-label="Menú móvil" className="flex flex-col">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                tabIndex={mobileOpen ? 0 : -1}
                style={{ transitionDelay: mobileOpen ? `${120 + i * 70}ms` : "0ms" }}
                className={`flex items-baseline justify-between border-b border-white/10 py-5 font-display text-[2.1rem] leading-none transition-[opacity,transform] duration-700 ease-silk ${
                  mobileOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                } ${isActive(link.href) ? "text-brand-gold-300" : ""}`}
              >
                {link.label}
                <span className="text-[0.6875rem] tracking-label text-white/40">0{i + 1}</span>
              </Link>
            ))}
          </nav>

          <div
            style={{ transitionDelay: mobileOpen ? "420ms" : "0ms" }}
            className={`mt-auto space-y-5 transition-opacity duration-700 ${mobileOpen ? "opacity-100" : "opacity-0"}`}
          >
            {profile?.role === "SUPER_ADMIN" && (
              <div className="rounded-[2px] border border-white/15 [&_button]:text-white">
                <ViewAsSelector viewAs={viewAs} onSelect={handleSelectRole} compact />
              </div>
            )}
            <div className="flex items-center justify-between">
              {!profile && !profileLoading ? (
                <Link href="/cuenta/entrar" tabIndex={mobileOpen ? 0 : -1} className="link-line">
                  Entrar a mi cuenta
                </Link>
              ) : profile ? (
                <Link href="/cuenta/perfil" tabIndex={mobileOpen ? 0 : -1} className="link-line">
                  Mi perfil
                </Link>
              ) : (
                <span />
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Espaciador en páginas sin hero inmersivo */}
      {!immersive && <div aria-hidden="true" className={viewAs ? "h-[calc(var(--header-h)+34px)]" : "h-[var(--header-h)]"} />}
    </>
  );
}
