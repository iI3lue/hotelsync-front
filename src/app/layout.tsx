import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import WarmUp from "@/components/WarmUp";
import NavbarClient from "@/components/NavbarClient";
import LoginToast from "@/components/LoginToast";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "HotelSync — Encontrá tu estadía ideal",
  description: "Explorá y reservá hoteles de nuestra cadena con las mejores tarifas.",
  openGraph: {
    title: "HotelSync",
    description: "Encontrá tu estadía perfecta",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0E8" },
    { media: "(prefers-color-scheme: dark)",  color: "#0A1628" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
        />
      </head>
      <body className="min-h-screen min-h-dvh bg-brand-cream-700 dark:bg-brand-navy antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-gold focus:px-4 focus:py-2 focus:text-brand-navy focus:font-semibold"
        >
          Saltar al contenido
        </a>

        <ThemeProvider>
          <CurrencyProvider>
          <ToastProvider>
          <WarmUp />
          <NavbarClient />

          <main id="contenido" className="min-h-[calc(100vh-72px)] min-h-[calc(100dvh-72px)]">
            {children}
          </main>

          <Suspense fallback={null}>
            <LoginToast />
          </Suspense>

          <footer className="mt-20 border-t border-brand-navy/8 bg-white dark:border-white/6 dark:bg-brand-navy-800">
            <div className="mx-auto max-w-7xl px-4 py-12">
              <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
                {/* Brand */}
                <div className="md:col-span-1">
                  <span className="font-display text-2xl font-semibold text-brand-navy dark:text-white">
                    Hotel<span className="text-brand-gold">Sync</span>
                  </span>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    La plataforma de gestión hotelera que conecta a huéspedes con experiencias únicas.
                  </p>
                </div>

                {/* Links */}
                <div>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Explorar
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      { href: "/", label: "Hoteles" },
                      { href: "/buscar", label: "Buscar" },
                      { href: "/mis-reservas", label: "Mis reservas" },
                    ].map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="text-sm text-gray-600 transition-colors hover:text-brand-gold dark:text-gray-400 dark:hover:text-brand-gold"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Mi cuenta
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      { href: "/cuenta/entrar",  label: "Entrar" },
                      { href: "/cuenta/crear",   label: "Crear cuenta" },
                      { href: "/mis-reservas",   label: "Mis reservas" },
                    ].map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="text-sm text-gray-600 transition-colors hover:text-brand-gold dark:text-gray-400 dark:hover:text-brand-gold"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Soporte
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      { href: "/admin", label: "Panel de administración" },
                    ].map((l) => (
                      <li key={l.href}>
                        <a
                          href={l.href}
                          className="text-sm text-gray-600 transition-colors hover:text-brand-gold dark:text-gray-400 dark:hover:text-brand-gold"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-brand-navy/6 pt-8 dark:border-white/6 sm:flex-row">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  © 2026 HotelSync. Todos los derechos reservados.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Construido con ❤️ para la industria hotelera
                </p>
              </div>
            </div>
          </footer>
          </ToastProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
