import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const themeInitScript = `
(() => {
  const storageKey = "theme-preference";
  const mediaQuery = "(prefers-color-scheme: dark)";
  const root = document.documentElement;
  const storedTheme = window.localStorage.getItem(storageKey);
  const theme = storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
    ? storedTheme
    : "system";
  const resolvedTheme = theme === "system"
    ? (window.matchMedia(mediaQuery).matches ? "dark" : "light")
    : theme;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  metadataBase: new URL('https://swarna.vercel.app'),
  alternates: {
    canonical: '/',
  },
  title: {
    template: "%s | Swarna",
    default: "Artificial Jewellery India",
  },
  description: "Discover premium artificial jewellery at Swarna. Explore our exquisite collection of necklaces, earrings, and bangles blending tradition with modern design.",
  keywords: ["artificial jewellery", "fake jewellery", "premium jewellery", "necklace", "earrings", "bangles", "Swarna", "traditional jewellery"],
  authors: [{ name: "Swarna" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://swarna.vercel.app",
    title: "Artificial Jewellery India | Necklaces & Earrings | Swarna",
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
    title: "Artificial Jewellery India | Necklaces & Earrings | Swarna",
    description: "Discover premium artificial jewellery that perfectly blends traditional craftsmanship with modern design.",
    creator: "@swarnajewellery",
  },
  verification: {
    google: "bSx1uXuKeRmpCwplbYbVo9EdV3d9WijCaWCkgreqCvs",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Swarna',
    url: 'https://swarna.vercel.app',
    logo: 'https://swarna.vercel.app/og-image.jpg',
    description: 'Discover premium artificial jewellery at Swarna. Explore our exquisite collection of necklaces, earrings, and bangles blending tradition with modern design.',
  };

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-[100dvh] flex flex-col`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <ToastProvider>
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
                />
                <AppShell>{children}</AppShell>
              </ToastProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
