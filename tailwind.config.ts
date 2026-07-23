import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F6F4",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1C2430",
          soft: "#5B6572",
          faint: "#8B94A0",
        },
        border: {
          DEFAULT: "#DDE1E3",
          strong: "#C3C9CD",
        },
        blueprint: {
          DEFAULT: "#1F5FA8",
          dark: "#154578",
          light: "#EAF1F9",
        },
        rust: {
          DEFAULT: "#C7752E",
          light: "#FBEEE2",
        },
        moss: {
          DEFAULT: "#2F8F5B",
          light: "#E7F4ED",
        },
        danger: {
          DEFAULT: "#B5432F",
          light: "#FBEAE7",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,36,48,0.06), 0 1px 1px rgba(28,36,48,0.04)",
        panel: "0 4px 24px rgba(28,36,48,0.10)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
