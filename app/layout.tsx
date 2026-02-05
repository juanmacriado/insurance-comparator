import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalNavigation from "@/components/GlobalNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xeoris Comparator",
  description: "Comparador de Pólizas de Ciberseguridad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <GlobalNavigation />
        {children}
      </body>
    </html>
  );
}
