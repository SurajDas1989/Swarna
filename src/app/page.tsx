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
import { getCachedStorefrontProducts } from "@/lib/storefront-products";

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
    return await getCachedStorefrontProducts();
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
