import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        serif: ["DM Serif Display", "Georgia", "serif"],
      },
      colors: {
        page: "#FAFAF7",
        card: "#FFFFFF",
        muted: "#F6F5F0",
        subtle: "#F2F1EC",
        accent: {
          DEFAULT: "#C23B22",
          bg: "rgba(194,59,34,0.08)",
          border: "rgba(194,59,34,0.12)",
        },
        border: {
          DEFAULT: "#E8E6E0",
          soft: "#D0CEC8",
        },
        text: {
          primary: "#1A1918",
          body: "#4A4840",
          secondary: "#6A6860",
          muted: "#7A7870",
          faint: "#9A9890",
          ghost: "#B0AEA8",
        },
        category: {
          j6: "#C23B22",
          face: "#B8652A",
          fraud: "#8A6B1E",
          crypto: "#2A6A7A",
          political: "#6A4B7A",
          drug: "#3A6A4A",
          other: "#7A7870",
        },
      },
      fontSize: {
        hero: ["52px", { lineHeight: "1.1" }],
        "page-title": ["36px", { lineHeight: "1.2" }],
        section: ["28px", { lineHeight: "1.3" }],
        stat: ["36px", { lineHeight: "1.1" }],
        "stat-sm": ["28px", { lineHeight: "1.1" }],
        "detail-name": ["42px", { lineHeight: "1.15" }],
        impact: ["20px", { lineHeight: "1.2" }],
        body: ["15px", { lineHeight: "1.8" }],
        nav: ["14px", { lineHeight: "1" }],
        "card-title": ["16px", { lineHeight: "1" }],
        "card-offense": ["13px", { lineHeight: "1.5" }],
        meta: ["12px", { lineHeight: "1" }],
        badge: ["11px", { lineHeight: "1" }],
        overline: ["11px", { lineHeight: "1" }],
        tracking: ["12px", { lineHeight: "1" }],
      },
      maxWidth: {
        home: "960px",
        search: "1040px",
        detail: "880px",
        source: "880px",
      },
      spacing: {
        section: "60px",
        card: "24px",
        "card-lg": "28px",
        "card-sm": "18px",
        grid: "12px",
        "stat-grid": "16px",
      },
      borderRadius: {
        card: "8px",
        badge: "4px",
        pill: "20px",
        input: "6px",
        "left-card": "0 8px 8px 0",
      },
    },
  },
  plugins: [],
} satisfies Config;
