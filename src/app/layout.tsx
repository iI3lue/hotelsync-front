import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource/gilda-display/400.css";
import "@fontsource-variable/jost/index.css";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import RevealObserver from "@/components/ui/RevealObserver";
import ThemeProvider from "@/components/ThemeProvider";
import NavbarClient from "@/components/NavbarClient";
import LoginToast from "@/components/LoginToast";
import WarmUp from "@/components/WarmUp";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: { default: "HotelSync — Hoteles en Colombia y Argentina", template: "%s · HotelSync" },
  description: "Explorá y reservá hoteles de nuestra cadena con las mejores tarifas.",
  openGraph: {
    title: "HotelSync",
    description: "Encontrá tu estadía perfecta",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F4F0" },
    { media: "(prefers-color-scheme: dark)",  color: "#141716" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      
      <body className="min-h-screen min-h-dvh antialiased">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:text-brand-navy"
        >
          Saltar al contenido
        </a>

        <ThemeProvider>
          <ToastProvider>
          <NavbarClient />

          <RevealObserver />
          <WarmUp />
          <main id="contenido" className="min-h-[70vh]">
            {children}
          </main>

          <Suspense fallback={null}>
            <LoginToast />
          </Suspense>

          <SiteFooter />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
