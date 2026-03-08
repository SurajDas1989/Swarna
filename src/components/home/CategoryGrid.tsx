"use client";

import Link from "next/link";
import { Gem, Gift, Sparkles, Crown } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const priceRanges = [
    { id: "all", title: "All Prices", description: "Explore full catalog", Icon: Gem },
    { id: "under500", title: "Under Rs.500", description: "Budget friendly gifts", Icon: Gift },
    { id: "500to1500", title: "Rs.500 - Rs.1500", description: "Premium selection", Icon: Sparkles },
    { id: "over1500", title: "Over Rs.1500", description: "Luxury collection", Icon: Crown },
];

export function CategoryGrid() {
    const { setActivePriceRange } = useAppContext();

    return (
        <section id="categories" className="hidden py-8 sm:block sm:py-16">
            <div className="container mx-auto px-4">
                <ScrollReveal>
                    <h2 className="mb-5 text-center text-2xl font-bold text-foreground sm:mb-10 sm:text-3xl">Shop By Price</h2>
                </ScrollReveal>

                <div className="flex snap-x gap-3 overflow-x-auto pb-2 hide-scrollbar sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
                    {priceRanges.map((range, index) => (
                        <ScrollReveal key={range.id} delay={index * 0.1} direction="up" className="w-36 shrink-0 snap-start sm:w-auto">
                            <Link
                                href="/#products"
                                onClick={() => setActivePriceRange(range.id)}
                                className="group flex h-full flex-col items-center rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-card sm:p-5"
                            >
                                <div className="mb-2 text-primary transition-transform group-hover:scale-110 sm:mb-3">
                                    <range.Icon className="h-7 w-7 sm:h-9 sm:w-9" />
                                </div>
                                <h3 className="mb-0.5 text-sm font-semibold leading-tight text-foreground sm:mb-1 sm:text-base">{range.title}</h3>
                                <p className="hidden text-[11px] text-gray-500 sm:block sm:text-sm">{range.description}</p>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
