import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { Features } from "@/components/home/Features";
import { About } from "@/components/home/About";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="sr-only">Swarna - Premium Artificial Jewellery & Accessories</h1>
      <HeroCarousel />
      <CategoryGrid />
      <FeaturedProducts />
      <RecentlyViewed />
      <About />
      <Features />
    </div>
  );
}
