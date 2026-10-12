"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logout, me, type AuthProfile } from "@/lib/auth-client";
import { useViewAs } from "@/lib/view-as";
import ViewAsSelector from "@/components/ViewAsSelector";
import ViewingAsBanner from "@/components/ViewingAsBanner";
import CurrencySelector from "@/components/CurrencySelector";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/",             label: "Inicio" },
  { href: "/buscar",       label: "Buscar" },
  { href: "/mis-reservas", label: "Mis reservas" },
];

function UserMenu({ profile, onLogout }: { profile: AuthProfile; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const initials = profile.email.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Menú de ${profile.name || profile.email}`}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-gold text-xs font-bold text-brand-navy shadow-gold transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      >
        {profile.picture_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.picture_url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-scale-in absolute right-0 top-11 z-40 min-w-52 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-elevated dark:bg-brand-navy-800">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-white/6">
              <p className="text-xs text-gray-400">Conectado como</p>
              <p className="mt-0.5 truncate text-sm font-medium text-brand-navy dark:text-gray-100">
                {profile.name || profile.email}
              </p>
              {profile.name && (
                <p className="truncate text-xs text-gray-400">{profile.email}</p>
              )}
            </div>
            <div className="py-1">
              <Link
                href="/cuenta/perfil"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Mi perfil
              </Link>
              <Link
                href="/mis-reservas"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                </svg>
                Mis reservas
              </Link>
              {profile.role !== "GUEST" && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Administrar
                </Link>
              )}
              <div className="my-1 h-px bg-gray-100 dark:bg-white/6" />
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { viewAs, viewedRole, setViewAs } = useViewAs(profile?.role ?? null);

  // "Ver como…" es solo renderizado: el personal simulado ve un acceso a
  // Administrar (filtrado por sección en el admin), el invitado no lo ve.
  // El backend sigue mandando con la sesión real.
  const navLinks =
    viewedRole !== "GUEST" && viewedRole !== "SUPER_ADMIN"
      ? [...NAV_LINKS, { href: "/admin", label: "Administrar" }]
      : NAV_LINKS;

  useEffect(() => {
    void me().then(setProfile);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await logout();
    setProfile(null);
    router.push("/");
    router.refresh();
  }

  return (
    <>
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-white/80 backdrop-blur-xl shadow-sm dark:bg-brand-navy/80"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        {/* Logo */}
        <Link
          href="/"
          translate="no"
          className="font-display text-xl font-semibold text-brand-navy transition-opacity hover:opacity-80 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          Hotel<span className="text-brand-gold">Sync</span>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link px-3 py-2 rounded-lg ${
                pathname === link.href
                  ? "text-brand-gold after:w-full"
                  : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {profile?.role === "SUPER_ADMIN" && (
            <div className="hidden md:block">
              <ViewAsSelector viewAs={viewAs} onSelect={setViewAs} />
            </div>
          )}
          <CurrencySelector />
          <ThemeToggle />

          {profile ? (
            <UserMenu profile={profile} onLogout={handleLogout} />
          ) : (
            <Link
              href="/cuenta/entrar"
              className="btn-ghost hidden md:inline-flex"
            >
              Entrar
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú"
            aria-expanded={mobileOpen}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-navy transition-colors hover:bg-brand-navy/8 dark:text-white dark:hover:bg-white/8 md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="animate-slide-up-sm border-t border-gray-100 bg-white px-4 pb-4 dark:border-white/6 dark:bg-brand-navy-800 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-brand-gold/10 text-brand-gold"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {profile?.role === "SUPER_ADMIN" && (
              <div className="mt-1 border-t border-gray-100 pt-2 dark:border-white/6">
                <ViewAsSelector viewAs={viewAs} onSelect={setViewAs} compact />
              </div>
            )}
            {!profile && (
              <Link
                href="/cuenta/entrar"
                className="mt-2 rounded-xl bg-brand-gold px-4 py-3 text-center text-sm font-semibold text-brand-navy"
              >
                Entrar a mi cuenta
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
    {viewAs && <ViewingAsBanner viewAs={viewAs} onExit={() => setViewAs(null)} />}
    </>
  );
}
