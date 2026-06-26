import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17142a",
        paper: "#f8f7ff",
        mist: "#eef2ff",
        line: "#d8d2f0",
        curtain: "#4c1d95",
        stage: "#2563eb",
        brass: "#c4b5fd",
        teal: "#1d4ed8",
        pine: "#1e3a8a",
        rose: "#7c3aed"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 20, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
