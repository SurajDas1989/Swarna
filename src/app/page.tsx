import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { RecentlyViewed } from "@/components/home/RecentlyViewed";
import { Features } from "@/components/home/Features";
import { About } from "@/components/home/About";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      <RecentlyViewed />
      <About />
      <Features />
    </div>
  );
}
