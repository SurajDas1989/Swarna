"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/context/AppContext";
import { getBlurDataUrl } from "@/lib/utils/imageBlur";

const RECENTLY_VIEWED_KEY = "jewelluxe_recently_viewed";

function getInitialRecentlyViewed(): Product[] {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw) as Product[];
        return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
    } catch (error) {
        console.error("Failed to load recently viewed products", error);
        return [];
    }
}

export function RecentlyViewed() {
    const [items] = useState<Product[]>(getInitialRecentlyViewed);

    if (items.length === 0) {
        return null;
    }

    return (
        <section className="bg-white py-10 transition-colors duration-300 dark:bg-background lg:py-14">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="mb-5 flex items-end justify-between">
                    <div>
                        <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-primary">Continue Shopping</span>
                        <h2 className="font-serif text-2xl text-gray-900 dark:text-foreground md:text-3xl">Recently Viewed</h2>
                    </div>
                    <span className="text-xs text-gray-400">{items.length} items</span>
                </div>

                <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2 lg:gap-5">
                    {items.map((product) => (
                        <Link
                            key={product.id}
                            href={`/product/${product.id}`}
                            className="group w-[44%] shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-card sm:w-[32%] lg:w-[22%]"
                        >
                            <div className="relative aspect-square overflow-hidden bg-[#F8F8F8] dark:bg-black">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    placeholder="blur"
                                    blurDataURL={getBlurDataUrl()}
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 768px) 44vw, 22vw"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="line-clamp-1 text-sm font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-foreground">
                                    {product.name}
                                </h3>
                                <p className="mt-1 text-sm font-semibold text-primary">
                                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.price)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
