"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Product } from "@/context/AppContext";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface ProductSliderProps {
    title: string;
    description?: string;
    products: Product[];
    viewAllLink?: string;
}

export function ProductSlider({ title, description, products, viewAllLink }: ProductSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener("resize", checkScroll);
        return () => window.removeEventListener("resize", checkScroll);
    }, [products]);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    if (products.length === 0) return null;

    return (
        <section className="py-16 dark:bg-background lg:py-24">
            <div className="container px-4 mx-auto">
                <ScrollReveal>
                    <div className="mb-8 px-1 lg:mb-12">
                        <h2 className="font-serif text-3xl text-gray-900 dark:text-foreground md:text-4xl">
                            {title}
                        </h2>
                    </div>
                </ScrollReveal>

                <div className="group relative">
                    {/* Desktop Navigation Arrows */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll("left")}
                            className="absolute -left-6 top-[calc(50%-2rem)] z-20 hidden -translate-y-1/2 rounded-full border border-gray-100 bg-white/90 p-4 text-gray-900 shadow-xl backdrop-blur-sm transition-all hover:bg-primary hover:text-white dark:border-white/10 dark:bg-card/90 dark:text-white lg:flex"
                            aria-label="Scroll Left"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}
                    
                    {canScrollRight && (
                        <button
                            onClick={() => scroll("right")}
                            className="absolute -right-6 top-[calc(50%-2rem)] z-20 hidden -translate-y-1/2 rounded-full border border-gray-100 bg-white/90 p-4 text-gray-900 shadow-xl backdrop-blur-sm transition-all hover:bg-primary hover:text-white dark:border-white/10 dark:bg-card/90 dark:text-white lg:flex"
                            aria-label="Scroll Right"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    )}

                    {/* Scroll Container */}
                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-8 scroll-snap-x mandatory lg:mx-0 lg:gap-8 lg:px-0"
                    >
                        {products.map((product) => (
                            <div 
                                key={product.id} 
                                className="w-[260px] flex-none scroll-snap-align-start md:w-[300px] lg:w-[320px]"
                            >
                                <ProductCard product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
