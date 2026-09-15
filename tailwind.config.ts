import type { Config } from "tailwindcss";

// Design system do Slotty: todas as cores/gradientes/fontes referenciam as
// CSS custom properties definidas em app/globals.css (:root). Assim o token
// vive num único lugar (globals.css) e o Tailwind só expõe classes utilitárias
// para ele (bg-brand-bg, text-brand-gradient, bg-brand-gradient, font-brand).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "brand-bg": "var(--color-rose-81603, #F4F0E3)",
        "brand-surface": "#FFFFFF",
        "brand-ink": "#1F1B24",
        "brand-muted": "#8A8378"
      },
      backgroundImage: {
        "brand-gradient":
          "var(--gradiente1, linear-gradient(135deg, #B780E7 22.67%, #F282B0 61.38%, #E56BB4 96.48%))"
      },
      fontFamily: {
        brand: ["Quache", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      borderRadius: {
        card: "1.25rem",
        pill: "999px"
      },
      boxShadow: {
        soft: "0 4px 24px rgba(31, 27, 36, 0.06)",
        "soft-lg": "0 12px 40px rgba(31, 27, 36, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
