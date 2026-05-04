import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google"; // Import fonts
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { GlobalCommandMenu } from "@/components/layout/GlobalCommandMenu";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Vetinet - El Ecosistema Veterinario definitivo",
  description: "Gestión clínica avanzada y red social para mascotas.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vetinet",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icono.png",
    apple: "/icons/icono.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { OfflineDetector } from "@/components/providers/OfflineDetector";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased text-foreground",
          inter.variable,
          nunito.variable
        )}
        suppressHydrationWarning
      >
        <OfflineDetector>
          {children}
          <GlobalCommandMenu />
          <Toaster richColors position="top-center" className="print:hidden" />
        </OfflineDetector>
      </body>
    </html>
  );
}
