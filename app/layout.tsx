import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
// import GlobalNavigation from "@/components/GlobalNavigation"; // Commenting out old navigation as the new design has its own header/nav structure

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Xeoris Solutions Portal",
  description: "Soluciones Inteligentes para tu Empresa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable} light`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        {/* Tailwind CDN script from portal.html is removed as we are using Tailwind via PostCSS in Next.js */}
      </head>
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-sans antialiased" suppressHydrationWarning>
        {/* <GlobalNavigation /> Removing verify because we are overriding the full page structure with the new design */}
        {children}
      </body>
    </html>
  );
}
