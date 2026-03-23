"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const slides = [
  {
    id: 1,
    image: "/Hero Coursal.jpg",
    mobileImage: "/Hero Coursal Mobile.jpg",
    title: "", // Empty to avoid clashing with image text
    subtitle: "",
    cta: "Shop the Sale",
    link: "#products",
    priority: true,
    objectPosition: "center",
    mobileObjectPosition: "right", // Focus on the "SALE" text
  },
  {
    id: 4,
    image: "/Hero Coursal 2.jpg",
    mobileImage: "/Hero Coursal Mobile 2.jpg",
    title: "",
    subtitle: "",
    cta: "Shop Now",
    link: "#products",
    priority: false,
    objectPosition: "center",
    mobileObjectPosition: "right",
  },
  {
    id: 3,
    image: "/hero-mobile.jpeg",
    mobileImage: "/hero-mobile.jpeg",
    title: "Timeless Elegance",
    subtitle: "Designed for the modern woman",
    cta: "View Collection",
    link: "#products",
    priority: false,
    objectPosition: "center",
    mobileObjectPosition: "center",
  },
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 10000); // 10 seconds

    return () => clearInterval(timer);
  }, [nextSlide, currentIndex]);

  const scrollToProducts = () => {
    const el = document.getElementById("products");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 1.1,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section className="group relative h-[65vh] min-h-[480px] w-full overflow-hidden bg-black md:h-[85vh]">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.8 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) {
              prevSlide();
            } else if (info.offset.x < -100) {
              nextSlide();
            }
          }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onClick={(e) => {
            // Only scroll if it wasn't a significant drag
            if (Math.abs(e.movementX) < 5) {
                scrollToProducts();
            }
          }}
        >
          {/* Background Image - Responsive */}
          <div className="relative h-full w-full">
            {/* Desktop Image */}
            <div className="hidden h-full w-full md:block">
              <Image
                src={slides[currentIndex].image}
                alt={slides[currentIndex].title || "Hero Image"}
                fill
                priority={slides[currentIndex].priority}
                className="object-cover"
                style={{ objectPosition: slides[currentIndex].objectPosition }}
                sizes="100vw"
                quality={90}
              />
            </div>
            {/* Mobile Image */}
            <div className="h-full w-full md:hidden">
              <Image
                src={slides[currentIndex].mobileImage}
                alt={slides[currentIndex].title || "Hero Image"}
                fill
                priority={slides[currentIndex].priority}
                className="object-cover"
                style={{ objectPosition: slides[currentIndex].mobileObjectPosition }}
                sizes="100vw"
                quality={90}
              />
            </div>
            {/* Overlay - Only show gradient if title/subtitle exists */}
            {(slides[currentIndex].title || slides[currentIndex].subtitle) && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent md:from-black/60 md:via-black/30" />
            )}
          </div>

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 md:px-12">
              <div className="max-w-2xl text-left md:text-left">
                {slides[currentIndex].title && (
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="mb-3 text-2xl font-bold tracking-tight text-primary sm:text-4xl md:text-6xl lg:text-7xl"
                  >
                    {slides[currentIndex].title}
                  </motion.h2>
                )}

                {slides[currentIndex].subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="mb-6 text-base font-light text-white/90 sm:text-lg md:text-xl lg:text-2xl"
                  >
                    {slides[currentIndex].subtitle}
                  </motion.p>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="flex flex-wrap gap-4"
                >
                  <Button
                    size="lg"
                    className="h-10 bg-primary px-6 text-xs font-semibold text-white transition-all hover:-translate-y-1 hover:bg-primary-dark hover:shadow-xl md:h-14 md:px-10 md:text-base"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToProducts();
                    }}
                  >
                    {slides[currentIndex].cta}
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute inset-x-0 top-1/2 z-20 hidden -translate-y-1/2 justify-between px-4 opacity-0 transition-opacity group-hover:opacity-100 md:flex lg:px-8">
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40 hover:scale-110 active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40 hover:scale-110 active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3 md:bottom-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`h-2.5 rounded-full transition-all duration-500 md:h-2 ${
              currentIndex === index
                ? "w-10 bg-primary shadow-lg md:w-8"
                : "w-2.5 bg-white/40 hover:bg-white/60 md:w-2"
            }`}
            style={{
              backgroundColor: currentIndex === index ? "var(--primary)" : "rgba(255, 255, 255, 0.4)",
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
