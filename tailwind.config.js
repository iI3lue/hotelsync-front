/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy:    "#0A1628",
          "navy-800": "#112240",
          "navy-700": "#1a3358",
          gold:    "#C9A84C",
          "gold-400": "#DFC06E",
          "gold-300": "#EDD38E",
          cream:   "#F5F0E8",
          "cream-700": "#E8DFC8",
          surface: "#FFFFFF",
        },
      },
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
        heading: ["Playfair Display", "Georgia", "serif"],
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #0A1628 0%, #1a3358 50%, #0f2040 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #C9A84C 0%, #EDD38E 50%, #C9A84C 100%)",
        "card-gradient":
          "linear-gradient(180deg, transparent 40%, rgba(10,22,40,0.85) 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
      },
      boxShadow: {
        "glass": "0 4px 24px -2px rgba(10,22,40,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
        "card":  "0 2px 16px -4px rgba(10,22,40,0.12), 0 8px 32px -8px rgba(10,22,40,0.08)",
        "card-hover": "0 8px 40px -8px rgba(10,22,40,0.22), 0 20px 48px -16px rgba(10,22,40,0.16)",
        "gold":  "0 0 32px -8px rgba(201,168,76,0.4)",
        "elevated": "0 24px 64px -12px rgba(10,22,40,0.28)",
      },
      borderRadius: {
        "2.5xl": "20px",
        "4xl": "32px",
      },
      keyframes: {
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up-sm": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,168,76,0.4)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(201,168,76,0)" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "check-draw": {
          from: { strokeDashoffset: "48" },
          to:   { strokeDashoffset: "0" },
        },
        "toast-in": {
          "0%":   { opacity: "0", transform: "translateX(100%) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "toast-out": {
          "0%":   { opacity: "1", transform: "translateX(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateX(100%) scale(0.96)" },
        },
        "progress-bar": {
          "0%":   { width: "0%" },
          "100%": { width: "100%" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
      },
      animation: {
        "slide-up":    "slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up-sm": "slide-up-sm 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":     "fade-in 0.4s ease both",
        "scale-in":    "scale-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
        shimmer:       "shimmer 1.6s ease-in-out infinite",
        float:         "float 3s ease-in-out infinite",
        "pulse-gold":  "pulse-gold 2s ease-in-out infinite",
        "spin-slow":   "spin-slow 0.8s linear infinite",
        "check-draw":  "check-draw 500ms cubic-bezier(0.16,1,0.3,1) both",
        "toast-in":    "toast-in 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "toast-out":   "toast-out 0.25s ease-in both",
        "progress-bar":"progress-bar 4s linear forwards",
        flicker:       "flicker 1.4s ease-in-out infinite",
        // stagger helpers via CSS var
        "slide-up-1":  "slide-up 0.5s 0.05s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up-2":  "slide-up 0.5s 0.1s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up-3":  "slide-up 0.5s 0.15s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up-4":  "slide-up 0.5s 0.2s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up-5":  "slide-up 0.5s 0.25s cubic-bezier(0.16,1,0.3,1) both",
        "slide-up-6":  "slide-up 0.5s 0.3s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
