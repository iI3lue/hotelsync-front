import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import AccountNav from "@/components/AccountNav";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import CurrencySelector from "@/components/CurrencySelector";
import WarmUp from "@/components/WarmUp";

const PROPERTY_API =
  process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:3001";
const RATE_API =
  process.env.NEXT_PUBLIC_RATE_API_URL || "http://localhost:3002";

export const metadata: Metadata = {
  title: "HotelSync — Encontrá tu estadía ideal",
  description: "Explorá y reservá hoteles de nuestra cadena",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={PROPERTY_API} />
        <link rel="preconnect" href={RATE_API} />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Saltar al contenido
        </a>
        <ThemeProvider>
          <CurrencyProvider>
          <WarmUp />
          <header className="bg-white shadow-sm dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
              <a
                href="/"
                translate="no"
                className="text-2xl font-bold text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:text-blue-400"
              >
                HotelSync
              </a>
              <nav aria-label="Principal" className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <a
                  href="/buscar"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-200 dark:hover:text-blue-400"
                >
                  Buscar
                </a>
                <a
                  href="/reservas/nueva"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-200 dark:hover:text-blue-400"
                >
                  Reservar
                </a>
                <a
                  href="/admin"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-200 dark:hover:text-blue-400"
                >
                  Administrar
                </a>
                <AccountNav />
                <ThemeToggle />
                <CurrencySelector />
              </nav>
            </div>
          </header>
          <main id="contenido" className="max-w-7xl mx-auto px-4 py-8">{children}</main>
          <footer className="bg-white border-t mt-12 dark:bg-gray-800 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              &copy; 2026 HotelSync. Todos los derechos reservados.
            </div>
          </footer>
        </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
