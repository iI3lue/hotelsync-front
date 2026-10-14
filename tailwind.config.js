/** @type {import('tailwindcss').Config} */

/*
 * Sistema visual "Casa de piedra" — HotelSync
 * ─────────────────────────────────────────────
 * Paleta refinada: papel de piedra caliza (fondos), carbón con sesgo verde
 * (texto y bandas oscuras) y latón envejecido (acento, usado con mesura en
 * filetes, etiquetas y estados). Los nombres de token se mantienen
 * (`brand.navy`, `brand.gold`, `brand.cream`) para que todo el código
 * existente — incluido el panel admin — herede la paleta sin cambios.
 */
const ink = {
  DEFAULT: "#1B1F1D",
  950: "#0E1110",
  900: "#141716",
  800: "#212624",
  700: "#2D3330",
  600: "#414844",
  500: "#5C635F",
};

/*
 * Escala "ink" para clases heredadas `blue-*` / `indigo-*` que todavía usa
 * el panel admin: en lugar de un azul ajeno a la marca, renderizan en la
 * gama carbón. El sitio público ya no las usa directamente.
 */
const legacyBlue = {
  50: "#F1F1EE",
  100: "#E4E4DF",
  200: "#CACBC4",
  300: "#A9ABA3",
  400: "#878A83",
  500: "#5C635F",
  600: "#2D3330",
  700: "#212624",
  800: "#1B1F1D",
  900: "#141716",
  950: "#0E1110",
};

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blue: legacyBlue,
        indigo: legacyBlue,
        brand: {
          navy: ink.DEFAULT,
          "navy-950": ink[950],
          "navy-900": ink[900],
          "navy-800": ink[800],
          "navy-700": ink[700],
          "navy-600": ink[600],
          "navy-500": ink[500],
          gold: "#A8874F",
          "gold-600": "#7A6136",
          "gold-400": "#BE9F6A",
          "gold-300": "#D8C39B",
          cream: "#F5F4F0",
          "cream-700": "#E6E3DC",
          paper: "#F5F4F0",
          stone: "#E6E3DC",
          "stone-300": "#D5D1C7",
          surface: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ['"Jost Variable"', "Jost", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ['"Gilda Display"', '"Times New Roman"', "Georgia", "serif"],
        heading: ['"Gilda Display"', '"Times New Roman"', "Georgia", "serif"],
      },
      fontSize: {
        "eyebrow": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.22em" }],
        "display-sm": ["clamp(2rem, 4vw, 2.75rem)", { lineHeight: "1.08", letterSpacing: "-0.01em" }],
        "display-md": ["clamp(2.5rem, 5.5vw, 4rem)", { lineHeight: "1.04", letterSpacing: "-0.015em" }],
        "display-lg": ["clamp(3rem, 8vw, 6.5rem)", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
      },
      // Escala de opacidad ampliada: habilita modificadores finos como
      // `border-brand-navy/12` o `bg-white/8` que el código ya usa.
      opacity: {
        3: "0.03", 4: "0.04", 6: "0.06", 7: "0.07", 8: "0.08", 12: "0.12",
        15: "0.15", 35: "0.35", 45: "0.45", 55: "0.55", 65: "0.65", 85: "0.85",
      },
      letterSpacing: {
        label: "0.18em",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(180deg, #141716 0%, #1B1F1D 100%)",
        "gold-gradient": "linear-gradient(90deg, #A8874F 0%, #BE9F6A 100%)",
        "card-gradient": "linear-gradient(180deg, transparent 40%, rgba(14,17,16,0.78) 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
      },
      boxShadow: {
        glass: "0 10px 40px -12px rgba(14,17,16,0.35)",
        card: "0 1px 2px rgba(14,17,16,0.04), 0 10px 30px -18px rgba(14,17,16,0.18)",
        "card-hover": "0 1px 2px rgba(14,17,16,0.05), 0 24px 48px -24px rgba(14,17,16,0.28)",
        gold: "none",
        elevated: "0 24px 64px -24px rgba(14,17,16,0.35)",
        xs: "0 1px 2px rgba(14,17,16,0.05)",
      },
      borderRadius: {
        lg: "4px",
        xl: "4px",
        "2xl": "6px",
        "2.5xl": "6px",
        "3xl": "8px",
        "4xl": "10px",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out-soft": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      transitionDuration: {
        900: "900ms",
        1200: "1200ms",
      },
      keyframes: {
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up-sm": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(168,135,79,0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(168,135,79,0)" },
        },
        "spin-slow": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
        "check-draw": { from: { strokeDashoffset: "48" }, to: { strokeDashoffset: "0" } },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "toast-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(12px)" },
        },
        "progress-bar": { "0%": { width: "0%" }, "100%": { width: "100%" } },
        flicker: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } },
        "line-rise": {
          "0%": { transform: "translateY(105%)" },
          "100%": { transform: "translateY(0)" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1.14)" },
          "100%": { transform: "scale(1.0)" },
        },
        "curtain-up": {
          "0%": { transform: "scaleY(1)" },
          "100%": { transform: "scaleY(0)" },
        },
        "scroll-cue": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "45%": { transform: "scaleY(1)", transformOrigin: "top" },
          "55%": { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
        "page-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up-sm": "slide-up-sm 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.5s ease both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-gold": "pulse-gold 2.4s ease-in-out infinite",
        "spin-slow": "spin-slow 0.8s linear infinite",
        "check-draw": "check-draw 500ms cubic-bezier(0.22,1,0.36,1) both",
        "toast-in": "toast-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        "toast-out": "toast-out 0.25s ease-in both",
        "progress-bar": "progress-bar 4s linear forwards",
        flicker: "flicker 1.4s ease-in-out infinite",
        "slide-up-1": "slide-up 0.7s 0.06s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up-2": "slide-up 0.7s 0.12s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up-3": "slide-up 0.7s 0.18s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up-4": "slide-up 0.7s 0.24s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up-5": "slide-up 0.7s 0.30s cubic-bezier(0.22,1,0.36,1) both",
        "slide-up-6": "slide-up 0.7s 0.36s cubic-bezier(0.22,1,0.36,1) both",
        "ken-burns": "ken-burns 2.6s cubic-bezier(0.22,1,0.36,1) both",
        "curtain-up": "curtain-up 1.1s cubic-bezier(0.65,0,0.35,1) both",
        "scroll-cue": "scroll-cue 2.4s cubic-bezier(0.65,0,0.35,1) infinite",
        "page-in": "page-in 0.5s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
