import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // New Design System Colors from portal.html
        primary: "#312E81", // Deep indigo/purple
        secondary: "#FACC15", // Brand yellow
        "background-light": "#F8FAFC",
        "background-dark": "#0F172A",
        // Keeping legacy colors for now
        xeoris: {
          blue: "#16313a",
          yellow: "#ffe008",
          gray: "#f3f4f6",
        }
      },
      fontFamily: {
        display: ["var(--font-outfit)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        'xeoris': '15px',
        DEFAULT: "1rem",
        'xl': '1.5rem',
      }
    },
  },
  plugins: [],
};
export default config;
