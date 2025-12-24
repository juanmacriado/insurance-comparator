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
        xeoris: {
          blue: "#16313a", // Updated from site
          yellow: "#ffe008", // Updated from site
          gray: "#f3f4f6",
        }
      },
    },
  },
  plugins: [],
};
export default config;
