import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SupabaseProvider } from "../context/SupabaseContext";
import { AppProvider } from "../context/AppContext";
import { ConditionalLayout } from "../components/ConditionalLayout";

export const metadata: Metadata = {
  title: "GoaFYI - Event Vendors",
  description: "Discover and book Goan event vendors - photographers, decorators, venues, and more",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GoaFYI",
  },
};

export const viewport: Viewport = {
  themeColor: "#be185d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GoaFYI" />
        <meta name="msapplication-TileColor" content="#be185d" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 safe-area transition-colors duration-300" suppressHydrationWarning>
        <SupabaseProvider>
          <AppProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AppProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
