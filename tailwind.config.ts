import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f1b1c",
        paper: "#fbf7ef",
        mist: "#f1eee7",
        line: "#dfd6ca",
        curtain: "#5d1630",
        stage: "#b7652b",
        brass: "#d6a756",
        teal: "#12716b",
        pine: "#1d5a4f",
        rose: "#9a3f5f"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(31, 27, 28, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
