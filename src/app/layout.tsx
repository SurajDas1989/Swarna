import type { Metadata } from "next";
import { Geist, Geist_Mono, Grenze_Gotisch } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartModal } from "@/components/layout/CartModal";
import { BackToTop } from "@/components/BackToTop";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const grenzeGotisch = Grenze_Gotisch({
  variable: "--font-grenze-gotisch",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://swarna.vercel.app'),
  alternates: {
    canonical: '/',
  },
  title: {
    template: "%s | Swarna",
    default: "Swarna - Premium Artificial Jewellery",
  },
  description: "Discover premium artificial jewellery that perfectly blends traditional craftsmanship with modern design.",
  keywords: ["artificial jewellery", "fake jewellery", "premium jewellery", "necklace", "earrings", "bangles", "Swarna"],
  authors: [{ name: "Swarna" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://swarna.vercel.app",
    title: "Swarna - Premium Artificial Jewellery",
    description: "Discover premium artificial jewellery that perfectly blends traditional craftsmanship with modern design.",
    siteName: "Swarna",
    images: [{
      url: "/og-image.jpg", // Assuming an og-image will be added later or fallback to a default
      width: 1200,
      height: 630,
      alt: "Swarna Jewellery"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Swarna - Premium Artificial Jewellery",
    description: "Discover premium artificial jewellery that perfectly blends traditional craftsmanship with modern design.",
    creator: "@swarnajewellery",
  },
  verification: {
    google: "bSx1uXuKeRmpCwplbYbVo9EdV3d9WijCaWCkgreqCvs",
  },
};

import { StickyDiscountTab } from "@/components/ui/StickyDiscountTab";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${grenzeGotisch.variable} antialiased min-h-[100dvh] flex flex-col`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <ToastProvider>
                <Navbar />
                <CartModal />
                <StickyDiscountTab />
                <main className="flex-grow pb-24 md:pb-0">{children}</main>
                <BackToTop />
                <MobileBottomNav />
                <Footer />
              </ToastProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
