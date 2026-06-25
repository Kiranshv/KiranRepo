import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0f1a",
        card: "#10182a",
        border: "#25324a",
        muted: "#8ea1c4",
        accent: "#5eead4",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444"
      }
    }
  },
  plugins: []
};

export default config;
