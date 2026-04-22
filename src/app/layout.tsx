import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brandAssets } from "@/lib/constants/brand-assets";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "sonner";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import { ThemeSync } from "@/components/theme/theme-sync";
import { SheriThemeSync } from "@/components/theme/sheri-theme-sync";

export const metadata: Metadata = {
  title: "IRONMIND — Elite Bodybuilding Performance",
  description: "Elite solo-athlete bodybuilding performance system. Track training, nutrition, recovery, and physique with data-driven precision.",
  keywords: ["bodybuilding", "fitness", "strength training", "nutrition tracking", "workout log"],
  authors: [{ name: "IRONMIND" }],
  other: {
    "mobile-web-app-capable": "yes",
  },
  manifest: "/manifest.json",
  icons: {
    apple: brandAssets.appleTouchIcon,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IRONMIND",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full text-foreground font-sans">
        <QueryProvider>
          <ThemeSync />
          <SheriThemeSync />
          {children}
          <RegisterServiceWorker />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(18,14,14,0.95)',
                border: '1px solid rgba(65,50,50,0.35)',
                color: '#F0F0F0',
                borderRadius: '12px',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
