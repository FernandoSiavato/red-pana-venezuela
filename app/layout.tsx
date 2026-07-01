import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import RegistrarSW from "@/components/RegistrarSW";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Red Pana Venezuela",
  description:
    "La red que conecta ayuda en Venezuela: insumos, albergues y páginas útiles. Hecho por tu pana de Global Shapers Caracas.",
  manifest: "/manifest.json",
  applicationName: "Red Pana",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Red Pana",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6b600",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <BottomNav />
        <RegistrarSW />
      </body>
    </html>
  );
}
