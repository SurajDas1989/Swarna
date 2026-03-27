import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { ShopByPriceMobile } from "@/components/home/ShopByPriceMobile";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { FaqSection } from "@/components/home/FaqSection";
import { Features } from "@/components/home/Features";
import { About } from "@/components/home/About";
import type { Metadata } from "next";
import type { Product } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Artificial Jewellery India | Necklaces & Earrings",
  description:
    "Shop artificial jewellery in India with statement necklaces, earrings, bangles, rings, and bridal sets from Swarna.",
  alternates: {
    canonical: "/",
  },
};

async function fetchInitialProducts(): Promise<Product[]> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/products`, {
      next: { revalidate: 3600, tags: ["products:list"] },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const initialProducts = await fetchInitialProducts();

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="sr-only">Swarna - Premium Artificial Jewellery & Accessories</h1>
      <HeroCarousel />
      <CategoryStrip />
      <ShopByPriceMobile />
      <CategoryGrid />
      <FeaturedProducts initialProducts={initialProducts} />
      <RecentlyViewed />
      <FaqSection />
      <About />
      <Features />
    </div>
  );
}
