"use client";

import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

type PriceRange = {
  id: string;
  title: string;
  maxPrice: number;
  image?: string;
};

const priceRanges: PriceRange[] = [
  // Uncomment the 'image' property when you have placed the images in the public/prices folder!
  { id: "under199", title: "Below 199", maxPrice: 199 /*, image: "/prices/under199.jpg" */ },
  { id: "under499", title: "Below 499", maxPrice: 499 /*, image: "/prices/under499.jpg" */ },
  { id: "under699", title: "Below 699", maxPrice: 699 /*, image: "/prices/under699.jpg" */ },
  { id: "under999", title: "Below 999", maxPrice: 999 /*, image: "/prices/under999.jpg" */ },
];

export function ShopByPriceMobile() {
  const { setActivePriceRange, setSearchQuery, setActiveCategory } = useAppContext();
  const router = useRouter();

  const handlePriceClick = (rangeId: string) => {
    // Add premium haptic feedback for real mobile devices
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); // Subtle physical tap feel
    }

    // Reset category and search to allow broad price filtering
    setActiveCategory("all");
    setSearchQuery("");
    
    setActivePriceRange(rangeId);
    
    const el = document.getElementById("products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/#products");
    }
  };

  return (
    <section className="bg-white py-8 border-b border-gray-100 dark:bg-[#121212] dark:border-white/10 sm:hidden">
      <div className="container mx-auto px-4">
        <motion.h2 
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="mb-8 text-center text-[16px] font-bold uppercase tracking-[0.2em] font-serif bg-gradient-to-r from-[#d4af37] via-[#f9e5a3] to-[#d4af37] bg-[length:200%_auto] text-transparent bg-clip-text drop-shadow-sm"
        >
          Shop by Price
        </motion.h2>
        
        <div className="grid grid-cols-2 gap-3">
          {priceRanges.map((range, index) => (
            <motion.div
              key={`wrapper-${range.id}`}
              initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: 30 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{ 
                duration: 1, 
                delay: 0.1 + index * 0.15, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="h-full w-full perspective-1000"
            >
              <motion.button
                onClick={() => handlePriceClick(range.id)}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.7 }}
                whileTap={{ scale: 0.93, y: 0 }}
                style={{
                  backgroundImage: range.image ? `url(${range.image})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
                className={`group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-[#d4af37]/50 ${!range.image ? 'bg-gradient-to-br from-[#fffcf5] to-[#fdf2e9] dark:from-[#1b1b1b] dark:to-[#111111]' : ''} p-4 py-6 transition-all duration-300 hover:border-[#f1d592] hover:shadow-[0_15px_30px_rgba(212,175,55,0.25)] focus:outline-none min-h-[96px] shadow-[0_8px_20px_rgba(212,175,55,0.08)]`}
              >
                {/* Automated Gold Border Shine (The Sparkle) for Mobile */}
                <motion.div 
                  className="absolute top-0 z-20 h-full w-[150%] -skew-x-[30deg] bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/30 pointer-events-none"
                  initial={{ left: "-200%" }}
                  animate={{ left: "200%" }}
                  transition={{ 
                    duration: 1.8, 
                    ease: "easeInOut", 
                    repeat: Infinity, 
                    repeatDelay: 2.5 + (index % 2) * 1.5 
                  }}
                />

                {/* Overlay to ensure text readability if there's an image */}
                {range.image && (
                  <div className="absolute inset-0 z-0 bg-black/40 transition-opacity" />
                )}
                
                <span className={`relative z-10 text-[16px] font-bold tracking-widest uppercase transition-transform duration-300 flex items-center gap-2 ${range.image ? 'text-white drop-shadow-md' : 'text-gray-900 dark:text-gray-100 drop-shadow-sm'}`}>
                  {range.title}
                  {/* Rotating Diamond SVG Sparkle */}
                  <motion.svg 
                    animate={{ rotate: 360, scale: [1, 1.3, 1] }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    className="w-3.5 h-3.5 text-[#d4af37]"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </motion.svg>
                </span>
                
                {/* Subtle decorative accent (only show if no image) */}
                {!range.image && (
                  <>
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.4, 1],
                        x: [0, 15, 0],
                        y: [0, -10, 0]
                      }} 
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 }}
                      className="absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-[#d4af37]/15 blur-xl pointer-events-none" 
                    />
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        x: [0, -10, 0],
                        y: [0, 15, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.6 }}
                      className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-rose-500/10 blur-lg pointer-events-none" 
                    />
                  </>
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
