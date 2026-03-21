"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

const categories = [
  { id: "jhumka", name: "Jhumka", image: "/categories/jhumka.png", filter: "earrings", searchQuery: "jhumka" },
  { id: "earrings", name: "Earrings", image: "/categories/earrings.png", filter: "earrings" },
  { id: "necklace", name: "Necklace", image: "/categories/necklace.png", filter: "necklaces" },
  { id: "pendant", name: "Pendant", image: "/categories/pendant.png", filter: "necklaces", search: "pendant" },
  { id: "jewellery-set", name: "Jewellery Set", image: "/categories/jewellery-set.png", filter: "sets" },
  { id: "bangles", name: "Bangles", image: "/categories/bangles.png", filter: "bangles" },
  { id: "rings", name: "Rings", image: "/categories/rings.png", filter: "rings" },
  { id: "new-arrivals", name: "New Arrivals", image: "/categories/new-arrivals.png", filter: "all" },
  { id: "best-sellers", name: "Best Sellers", image: "/categories/best-sellers.png", filter: "all" },
];

export function CategoryStrip() {
  const { setActiveCategory, setSearchQuery, setActivePriceRange } = useAppContext();
  const router = useRouter();

  const handleCategoryClick = (category: any) => {
    // Reset other filters
    setActivePriceRange("all");
    
    // Set category and search
    setActiveCategory(category.filter);
    
    // Specifically handle Jhumka search or others
    if (category.id === "jhumka") {
        setSearchQuery("jhumka");
    } else if (category.search) {
        setSearchQuery(category.search);
    } else {
        setSearchQuery("");
    }
    
    // Scroll to products
    const el = document.getElementById("products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/#products");
    }
  };

  return (
    <section className="bg-[#fdfbf7] py-6 sm:py-10 border-b border-gray-100/50">
      <div className="container mx-auto px-4">
        <div className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:gap-8 sm:pb-4 lg:justify-center lg:overflow-visible">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="group flex shrink-0 snap-center flex-col items-center gap-2 transition-all duration-300 sm:gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative flex aspect-square w-[64px] items-center justify-center overflow-hidden rounded-full border border-black/5 bg-[#fdf2e9] shadow-sm transition-shadow group-hover:shadow-md 
                           sm:w-[84px] md:w-[94px] lg:w-[104px] xl:w-[114px]"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 64px, (max-width: 768px) 84px, (max-width: 1024px) 94px, 114px"
                  loading="lazy"
                />
              </motion.div>
              <span className="max-w-[80px] text-center text-[10px] font-medium uppercase tracking-wider text-gray-700 transition-colors group-hover:text-primary sm:max-w-none sm:text-[11px] lg:text-xs lg:tracking-widest">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
