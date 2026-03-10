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
  title: "Swarna",
  description: "Premium Artificial Jewellery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${grenzeGotisch.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <ToastProvider>
                <Navbar />
                <CartModal />
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
