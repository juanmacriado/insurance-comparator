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
          blue: "#16313a", // Precise brand petrol
          yellow: "#ffe008", // Precise brand yellow
          gray: "#f3f4f6",
        }
      },
      borderRadius: {
        'xeoris': '15px', // Brand rounded style
      }
    },
  },
  plugins: [],
};
export default config;
