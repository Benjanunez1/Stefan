import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#030303",
          panel: "#0A0806",
        },
        core: {
          DEFAULT: "#EAF6FF",
          blue: "#2E8FFF",
          bright: "#7AC8FF",
          accent: "#00D4FF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
