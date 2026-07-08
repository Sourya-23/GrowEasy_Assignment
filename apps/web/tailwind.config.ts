import type { Config } from "tailwindcss";

/**
 * GrowEasy design tokens, eyeballed from the product screenshots
 * (import modal + Manage Leads table). VERIFY exact hex values against the
 * live product with devtools before final polish, then update here.
 *
 * All colors are exposed as CSS variables (see app/globals.css) so dark mode
 * is a variable swap, not a second palette.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: "var(--brand-teal)",
          "teal-dark": "var(--brand-teal-dark)",
          orange: "var(--brand-orange)",
          "orange-disabled": "var(--brand-orange-disabled)",
        },
        status: {
          good: "var(--status-good)",
          "good-bg": "var(--status-good-bg)",
          sale: "var(--status-sale)",
          "sale-bg": "var(--status-sale-bg)",
          neutral: "var(--status-neutral)",
          "neutral-bg": "var(--status-neutral-bg)",
          bad: "var(--status-bad)",
          "bad-bg": "var(--status-bad-bg)",
        },
        surface: "var(--bg-surface)",
        page: "var(--bg-page)",
        line: "var(--border)",
        ink: {
          DEFAULT: "var(--text-primary)",
          soft: "var(--text-secondary)",
        },
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
        modal: "0 20px 50px rgba(0,0,0,0.18)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
