"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppContext, Product } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { ArrowUpDown, Check, ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react";
import { getBlurDataUrl } from "@/lib/utils/imageBlur";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Skeleton } from "@/components/ui/Skeleton";

export const FILTERS = [
    { id: "all", label: "All Products" },
    { id: "liked", label: "Liked" },
    { id: "necklaces", label: "Necklaces" },
    { id: "earrings", label: "Earrings" },
    { id: "bangles", label: "Bangles" },
    { id: "rings", label: "Rings" },
    { id: "bracelets", label: "Bracelets" },
    { id: "sets", label: "Sets" },
];

export const SORT_OPTIONS = [
    { id: "default", label: "Default" },
    { id: "price-asc", label: "Price: Low to High" },
    { id: "price-desc", label: "Price: High to Low" },
    { id: "rating", label: "Highest Rated" },
    { id: "discount", label: "Biggest Discount" },
];

const MOBILE_SEARCH_FOCUS_KEY = "mobile-search-focus";

function ProductCardSkeleton() {
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-white/5 dark:bg-card">
            <Skeleton className="aspect-[4/5] w-full rounded-none" />
            <div className="flex flex-1 flex-col gap-2 p-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-6 w-1/2" />
                <div className="mt-auto flex items-center justify-between">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function FeaturedProducts() {
    const {
        products,
        isProductsLoading,
        toggleWishlist,
        isInWishlist,
        addToCart,
        activeCategory,
        setActiveCategory,
        setActivePriceRange,
        searchQuery,
        setSearchQuery,
    } = useAppContext();

    const { showToast } = useToast();
    const router = useRouter();
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);
    const [sortBy, setSortBy] = useState("default");
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [addedProductId, setAddedProductId] = useState<string | null>(null);
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [mobileSortOpen, setMobileSortOpen] = useState(false);

    useEffect(() => {
        const focusSearch = () => {
            mobileSearchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            window.setTimeout(() => mobileSearchInputRef.current?.focus(), 220);
        };

        const shouldFocusFromSession = sessionStorage.getItem(MOBILE_SEARCH_FOCUS_KEY) === "1";
        if (shouldFocusFromSession) {
            sessionStorage.removeItem(MOBILE_SEARCH_FOCUS_KEY);
            focusSearch();
        }

        window.addEventListener("focus-products-search", focusSearch);
        return () => window.removeEventListener("focus-products-search", focusSearch);
    }, []);

    useEffect(() => {
        const closeMenus = () => {
            setMobileFilterOpen(false);
            setMobileSortOpen(false);
        };

        window.addEventListener("scroll", closeMenus, { passive: true });
        return () => window.removeEventListener("scroll", closeMenus);
    }, []);


    const filteredProducts = useMemo(() => {
        if (activeCategory === "liked") {
            return products.filter((p) => isInWishlist(p.id));
        }

        return products;
    }, [activeCategory, isInWishlist, products]);

    const sortedProducts = useMemo(() => {
        // Create a shallow copy to avoid mutating the original array
        const nextProducts = [...filteredProducts];

        switch (sortBy) {
            case "price-asc":
                nextProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
                break;
            case "price-desc":
                nextProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
                break;
            case "rating":
                nextProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case "discount":
                nextProducts.sort((a, b) => {
                    const discountA = a.originalPrice > 0 ? (a.originalPrice - a.price) / a.originalPrice : 0;
                    const discountB = b.originalPrice > 0 ? (b.originalPrice - b.price) / b.originalPrice : 0;
                    return discountB - discountA;
                });
                break;
            default:
                // For 'default', we keep the order from the API which is typically 'createdAt' desc
                break;
        }

        return nextProducts;
    }, [filteredProducts, sortBy]);

    const displayedProducts = useMemo(() => {
        // If there are few products as in the filtered case, we show them all
        if (sortedProducts.length <= 8) return sortedProducts;
        return showAllProducts ? sortedProducts : sortedProducts.slice(0, 8);
    }, [showAllProducts, sortedProducts]);

    const handleAddToCart = (product: Product) => {
        addToCart(product.id);
        setAddedProductId(product.id);
        setTimeout(() => {
            setAddedProductId((prev) => (prev === product.id ? null : prev));
        }, 850);
        showToast(`Added ${product.name} to cart`, "success");
    };

    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
        setShowAllProducts(false);
    };

    const handleSortChange = (nextSort: string) => {
        setSortBy(nextSort);
        // Don't reset showAllProducts here to avoid layout jump if user already expanded
    };

    return (
        <section id="products" className="bg-white py-16 pb-24 transition-colors duration-300 dark:bg-background lg:py-24 lg:pb-24">
            <div className="container mx-auto max-w-7xl px-4">
                <ScrollReveal>
                    <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end lg:mb-12">
                        <div className="text-center md:text-left">
                            <span className="mb-2 block text-sm font-medium uppercase tracking-wider text-primary">Our Collection</span>
                            <h2 className="font-serif text-3xl text-gray-900 dark:text-foreground md:text-4xl">Timeless Elegance</h2>
                        </div>
                    </div>
                </ScrollReveal>

                <div className="sticky top-24 z-40 mb-5 bg-white/95 px-1 py-2 backdrop-blur dark:bg-background/95 md:hidden">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            id="mobile-products-search"
                            ref={mobileSearchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowAllProducts(false);
                                if (e.target.value.trim().length > 0) {
                                    router.push("/#products");
                                }
                            }}
                            placeholder="Search jewellery..."
                            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-white/15 dark:bg-white/5 dark:text-foreground"
                        />
                    </div>

                    <div className="relative mt-3 border-b border-gray-200 px-1 pb-2 dark:border-white/10">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileFilterOpen((prev) => !prev);
                                    setMobileSortOpen(false);
                                }}
                                className="inline-flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.08em] text-gray-800 dark:text-gray-100"
                                aria-expanded={mobileFilterOpen}
                                aria-controls="mobile-filter-menu"
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span>Filter</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setMobileSortOpen((prev) => !prev);
                                    setMobileFilterOpen(false);
                                }}
                                className="inline-flex items-center gap-1 text-[13px] font-medium text-gray-700 dark:text-gray-200"
                                aria-expanded={mobileSortOpen}
                                aria-controls="mobile-sort-menu"
                            >
                                <span>Sort</span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${mobileSortOpen ? "rotate-180" : ""}`} />
                            </button>
                        </div>

                        {mobileFilterOpen && (
                            <div
                                id="mobile-filter-menu"
                                className="mt-2 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-card"
                            >
                                {FILTERS.map((filter) => (
                                    <button
                                        key={filter.id}
                                        type="button"
                                        onClick={() => {
                                            handleCategoryChange(filter.id);
                                            setMobileFilterOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] ${activeCategory === filter.id
                                            ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white"
                                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                                            }`}
                                    >
                                        <span>{filter.label}</span>
                                        {activeCategory === filter.id ? <Check className="h-3.5 w-3.5" /> : null}
                                    </button>
                                ))}
                            </div>
                        )}

                        {mobileSortOpen && (
                            <div
                                id="mobile-sort-menu"
                                className="mt-2 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-white/10 dark:bg-card"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => {
                                            handleSortChange(opt.id);
                                            setMobileSortOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] ${sortBy === opt.id
                                            ? "bg-gray-100 font-medium text-gray-900 dark:bg-white/10 dark:text-white"
                                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                                            }`}
                                    >
                                        <span>{opt.label}</span>
                                        {sortBy === opt.id ? <Check className="h-3.5 w-3.5" /> : null}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-12 hidden flex-col items-start justify-between gap-6 lg:flex lg:flex-row lg:items-center">
                    <div className="hide-scrollbar -mx-4 flex w-full overflow-x-auto px-4 pb-2 lg:mx-0 lg:w-auto lg:px-0 lg:pb-0">
                        <div className="flex gap-2">
                            {FILTERS.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => handleCategoryChange(filter.id)}
                                    className={`whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${activeCategory === filter.id
                                        ? "bg-gray-900 text-white shadow-md dark:bg-primary"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="group relative min-w-[200px]">
                        <button className="w-full rounded-full border border-gray-200 bg-gray-50 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/20">
                            <span className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                                    {SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label}
                                </span>
                            </span>
                        </button>

                        <div className="invisible absolute right-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:border-white/10 dark:bg-card">
                            {SORT_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleSortChange(opt.id)}
                                    className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${sortBy === opt.id
                                        ? "bg-primary/5 font-medium text-primary dark:bg-primary/10"
                                        : "text-gray-700 dark:text-gray-300"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {isProductsLoading ? (
                    <div className="grid grid-cols-2 gap-3 transition-all duration-500 lg:grid-cols-4 lg:gap-6 xl:gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <ProductCardSkeleton key={n} />
                        ))}
                    </div>
                ) : sortedProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 transition-all duration-500 lg:grid-cols-4 lg:gap-6 xl:gap-8">
                        {displayedProducts.map((product, idx) => {
                            const isAdded = addedProductId === product.id;

                            return (
                                <ScrollReveal key={`prod-${product.id}`} delay={0.05 * (idx % 4)} direction="up" className="h-full">
                                    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-500 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl dark:border-white/5 dark:bg-card dark:hover:border-primary/35 dark:hover:shadow-primary/10">
                                        <div className="relative aspect-[4/5] overflow-hidden bg-[#F8F8F8] p-3 dark:bg-black lg:p-6">
                                            {product.originalPrice > product.price && (
                                                <div className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm lg:left-4 lg:top-4 lg:px-2.5 lg:py-1 lg:text-xs">
                                                    -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                                                </div>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggleWishlist(product.id);
                                                    const alreadyLiked = isInWishlist(product.id);
                                                    showToast(alreadyLiked ? "Removed from Wishlist" : "Added to Wishlist", alreadyLiked ? "wishlist" : "success");
                                                }}
                                                className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-sm backdrop-blur transition-colors hover:bg-red-50 hover:text-red-500 lg:right-4 lg:top-4 lg:h-8 lg:w-8"
                                            >
                                                <span className={`text-base ${isInWishlist(product.id) ? "text-red-500" : ""}`}>
                                                    {isInWishlist(product.id) ? "❤" : "♡"}
                                                </span>
                                            </button>

                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                placeholder="blur"
                                                blurDataURL={getBlurDataUrl()}
                                                className="object-contain p-4 drop-shadow-lg transition-transform duration-700 ease-in-out group-hover:scale-108 group-hover:rotate-[0.7deg] lg:p-8"
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                                            />

                                            <div className="absolute inset-x-0 bottom-0 hidden translate-y-4 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:block">
                                                <Button
                                                    disabled={isAdded}
                                                    className={`w-full shadow-lg transition-all duration-300 ${isAdded
                                                        ? "bg-emerald-600 text-white hover:bg-emerald-600"
                                                        : "bg-white text-gray-900 hover:bg-primary hover:text-white"
                                                        }`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddToCart(product);
                                                    }}
                                                >
                                                    {isAdded ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <Check className="h-4 w-4" /> Added
                                                        </span>
                                                    ) : (
                                                        "Quick Add"
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex flex-1 flex-col p-3 lg:p-5">
                                            <Link href={`/product/${product.id}`} className="mb-1 block">
                                                <h3 className="line-clamp-2 text-sm font-medium text-gray-900 transition-colors hover:text-primary dark:text-foreground lg:line-clamp-1 lg:text-base">
                                                    {product.name}
                                                </h3>
                                            </Link>

                                            <div className="mt-auto flex items-center justify-between pt-2 lg:pt-4">
                                                <div className="flex flex-col">
                                                    <span className="text-base font-semibold text-gray-900 dark:text-foreground lg:text-lg">
                                                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.price)}
                                                    </span>
                                                    {product.originalPrice > product.price && (
                                                        <span className="text-xs text-gray-400 line-through lg:text-sm">
                                                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddToCart(product);
                                                    }}
                                                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 lg:hidden ${isAdded
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-gray-100 text-gray-900 hover:bg-primary hover:text-white dark:bg-white/5 dark:text-foreground dark:hover:bg-primary"
                                                        }`}
                                                    aria-label={isAdded ? "Added" : "Add to Cart"}
                                                >
                                                    {isAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 py-20 text-center dark:border-white/10 dark:bg-white/5">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl shadow-sm dark:bg-card">
                            🔍
                        </div>
                        <h3 className="mb-2 text-xl font-semibold text-foreground">No products found</h3>
                        <p className="mx-auto mb-6 max-w-md text-gray-500">
                            We could not find products for your current filters. Try adjusting search or category.
                        </p>
                        <Button
                            onClick={() => {
                                setActiveCategory("all");
                                setActivePriceRange("all");
                                setSearchQuery("");
                            }}
                            className="rounded-full bg-primary px-8 text-white hover:bg-primary/90"
                        >
                            Clear All Filters
                        </Button>
                    </div>
                )}

                {sortedProducts.length > 8 && !showAllProducts && (
                    <div className="mt-12 text-center lg:mt-16">
                        <Button
                            variant="outline"
                            size="lg"
                            className="rounded-full border-gray-300 px-12 text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/5"
                            onClick={() => setShowAllProducts(true)}
                        >
                            View All Products Collection
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}














