"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    SlidersHorizontal, ArrowUpDown, ChevronRight, Home, 
    LayoutGrid, List, X, Check, Search, Filter
} from "lucide-react";
import Link from "next/link";
import { Product } from "@/context/AppContext";
import { ProductCard } from "@/components/shared/ProductCard";
import { Button } from "@/components/ui/button";
import { AdaptiveContainer } from "@/components/layout/LayoutPrimitives";

interface CollectionPageProps {
    title: string;
    description?: string;
    products: Product[];
    categorySlug?: string;
}

const SORT_OPTIONS = [
    { id: "newest", label: "Newest Arrivals" },
    { id: "price-asc", label: "Price: Low to High" },
    { id: "price-desc", label: "Price: High to Low" },
    { id: "discount", label: "Biggest Savings" },
];

const PRICE_TIERS = [
    { id: "under-400", label: "Under ₹400", filter: (p: Product) => p.price < 400 },
    { id: "400-1000", label: "₹400 - ₹1000", filter: (p: Product) => p.price >= 400 && p.price <= 1000 },
    { id: "above-1000", label: "Above ₹1000", filter: (p: Product) => p.price > 1000 },
];

// Helper to handle the polymorphic category type in Product
const getCategorySlug = (category: Product["category"]): string => {
    if (typeof category === "string") return category.toLowerCase();
    return (category?.slug || category?.name || "").toLowerCase();
};

export function CollectionPage({ title, description, products, categorySlug }: CollectionPageProps) {
    const [sortBy, setSortBy] = useState("newest");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Filter State
    const [selectedPriceTiers, setSelectedPriceTiers] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [inStockOnly, setInStockOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Derive available categories from current product set
    const availableCategories = useMemo(() => {
        const cats = new Set(products.map(p => getCategorySlug(p.category)));
        return Array.from(cats).sort();
    }, [products]);

    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products];

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.description.toLowerCase().includes(query) ||
                getCategorySlug(p.category).includes(query)
            );
        }

        // Category Filter
        if (selectedCategories.length > 0) {
            result = result.filter(p => selectedCategories.includes(getCategorySlug(p.category)));
        }

        // Price Tier Filter
        if (selectedPriceTiers.length > 0) {
            result = result.filter(p => {
                return selectedPriceTiers.some(tierId => {
                    const tier = PRICE_TIERS.find(t => t.id === tierId);
                    return tier ? tier.filter(p) : true;
                });
            });
        }

        // Stock Filter
        if (inStockOnly) {
            result = result.filter(p => (p.stock ?? 0) > 0);
        }

        // Sort
        switch (sortBy) {
            case "price-asc": return result.sort((a, b) => a.price - b.price);
            case "price-desc": return result.sort((a, b) => b.price - a.price);
            case "discount": return result.sort((a, b) => {
                const discA = a.originalPrice - a.price;
                const discB = b.originalPrice - b.price;
                return discB - discA;
            });
            default: return result;
        }
    }, [products, sortBy, selectedPriceTiers, selectedCategories, inStockOnly, searchQuery]);

    const togglePriceTier = (id: string) => {
        setSelectedPriceTiers(prev => 
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const clearAllFilters = () => {
        setSelectedPriceTiers([]);
        setSelectedCategories([]);
        setInStockOnly(false);
        setSearchQuery("");
    };

    const activeFilterCount = selectedPriceTiers.length + selectedCategories.length + (inStockOnly ? 1 : 0);

    return (
        <div className="min-h-screen bg-white dark:bg-background pb-20 overflow-x-hidden">
            {/* Header / Hero Section */}
            <div className="relative border-b border-gray-100 bg-[#FBFBFB] dark:border-white/5 dark:bg-black/40 pt-8 pb-12 lg:pt-12 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl opacity-30" />
                
                <AdaptiveContainer>
                    {/* Breadcrumbs */}
                    <nav className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5"><Home className="w-3 h-3" /> Home</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/collections/all" className="hover:text-primary transition-colors">Collections</Link>
                        {categorySlug && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-primary">{title}</span>
                            </>
                        )}
                    </nav>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-4xl"
                    >
                        <h1 className="mb-6 font-serif text-4xl font-light tracking-tight text-gray-900 dark:text-white md:text-6xl lg:text-8xl leading-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-lg leading-relaxed text-gray-500 dark:text-gray-400 max-w-2xl font-light">
                                {description}
                            </p>
                        )}
                    </motion.div>
                </AdaptiveContainer>
            </div>

            {/* Sticky Toolbar */}
            <div className="sticky top-[108px] z-40 border-b border-gray-100 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-background/80 py-4 shadow-sm sm:py-6">
                <AdaptiveContainer>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 ${
                                    isFilterOpen || activeFilterCount > 0 ? "text-primary px-4 py-2 bg-primary/5 rounded-full ring-1 ring-primary/20" : "text-gray-900 dark:text-white"
                                }`}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] leading-none">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                            <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                                {filteredAndSortedProducts.length} Results
                            </p>
                        </div>

                        <div className="flex items-center gap-4 sm:gap-8">
                            {/* Search Minimal */}
                            <div className="relative group max-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search pieces..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-primary/20 focus:bg-white dark:focus:bg-white/10 rounded-full text-xs font-medium w-full transition-all outline-none"
                                />
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative group">
                                <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-700 hover:text-primary transition-colors dark:text-gray-300">
                                    <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.id === sortBy)?.label}</span>
                                    <span className="sm:hidden">Sort</span>
                                </button>
                                
                                <div className="invisible absolute right-0 top-full pt-4 opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 z-50">
                                    <div className="w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-card py-2">
                                        {SORT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSortBy(opt.id)}
                                                className={`w-full px-5 py-3 text-left text-[11px] font-bold tracking-widest transition-colors hover:bg-gray-50 dark:hover:bg-white/5 uppercase ${
                                                    sortBy === opt.id ? "text-primary bg-primary/5" : "text-gray-500 dark:text-gray-400"
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AdaptiveContainer>
            </div>

            <AdaptiveContainer className="mt-8 lg:mt-16">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                    {/* Filter Sidebar (Desktop) */}
                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.aside
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="hidden lg:block w-72 shrink-0 space-y-10"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white">Refine By</h3>
                                    {activeFilterCount > 0 && (
                                        <button onClick={clearAllFilters} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">Clear All</button>
                                    )}
                                </div>

                                {/* Price Filter */}
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Price Range</h4>
                                    <div className="space-y-3">
                                        {PRICE_TIERS.map(tier => (
                                            <label key={tier.id} className="flex items-center gap-3 group cursor-pointer">
                                                <div 
                                                    onClick={() => togglePriceTier(tier.id)}
                                                    className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                                                        selectedPriceTiers.includes(tier.id) ? "bg-primary border-primary" : "border-gray-200 dark:border-white/10 group-hover:border-primary/50"
                                                    }`}
                                                >
                                                    {selectedPriceTiers.includes(tier.id) && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">{tier.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Category Filter */}
                                <div className="space-y-6 border-t border-gray-100 dark:border-white/5 pt-10">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Categories</h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {availableCategories.map(cat => (
                                            <label key={cat} className="flex items-center gap-3 group cursor-pointer">
                                                <div 
                                                    onClick={() => toggleCategory(cat)}
                                                    className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                                                        selectedCategories.includes(cat) ? "bg-primary border-primary" : "border-gray-200 dark:border-white/10 group-hover:border-primary/50"
                                                    }`}
                                                >
                                                    {selectedCategories.includes(cat) && <Check className="w-3.5 h-3.5 text-white" />}
                                                </div>
                                                <span className="text-xs font-medium capitalize text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Availability */}
                                <div className="space-y-6 border-t border-gray-100 dark:border-white/5 pt-10">
                                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Availability</h4>
                                    <label className="flex items-center gap-3 group cursor-pointer">
                                        <div 
                                            onClick={() => setInStockOnly(!inStockOnly)}
                                            className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                                                inStockOnly ? "bg-primary border-primary" : "border-gray-200 dark:border-white/10 group-hover:border-primary/50"
                                            }`}
                                        >
                                            {inStockOnly && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors">Only In Stock</span>
                                    </label>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {/* Main Content Area */}
                    <main className="flex-1">
                        <AnimatePresence mode="wait">
                            {filteredAndSortedProducts.length > 0 ? (
                                <motion.div
                                    key={`${sortBy}-${activeFilterCount}-${searchQuery}`} // Re-animate on any change
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-3 lg:gap-x-8 lg:gap-y-16"
                                >
                                    {filteredAndSortedProducts.map((product, idx) => (
                                        <motion.div
                                            key={product.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                                        >
                                            <ProductCard product={product} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="py-24 text-center">
                                    <div className="mx-auto w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <Search className="w-10 h-10 text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No masterpieces matched your filters</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
                                    <Button 
                                        onClick={clearAllFilters}
                                        className="mt-8 rounded-full px-8 bg-gray-900 text-white dark:bg-primary dark:text-amber-900"
                                    >
                                        Clear All Filters
                                    </Button>
                                </div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </AdaptiveContainer>

            {/* Mobile Filter Overlay (simplified implementation for brevity) */}
            <AnimatePresence>
                {isFilterOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 pointer-events-none">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" 
                        />
                        <motion.aside
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-card p-8 pointer-events-auto overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="text-lg font-serif italic text-gray-900 dark:text-white">Refine Selection</h3>
                                <button onClick={() => setIsFilterOpen(false)}><X className="w-6 h-6" /></button>
                            </div>

                            {/* Mobile Filters Content - Reusing logic */}
                            <div className="space-y-12 pb-20">
                                <div className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Price Range</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {PRICE_TIERS.map(tier => (
                                            <Button
                                                key={tier.id}
                                                variant={selectedPriceTiers.includes(tier.id) ? "default" : "outline"}
                                                onClick={() => togglePriceTier(tier.id)}
                                                className="justify-start rounded-xl h-12"
                                            >
                                                {tier.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6 pt-10 border-t border-gray-100 dark:border-white/5">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Categories</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {availableCategories.map(cat => (
                                            <Button
                                                key={cat}
                                                variant={selectedCategories.includes(cat) ? "default" : "outline"}
                                                onClick={() => toggleCategory(cat)}
                                                className="rounded-full capitalize h-10 px-6"
                                            >
                                                {cat}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full rounded-2xl h-16 text-lg font-bold bg-primary text-white"
                                >
                                    Apply Results ({filteredAndSortedProducts.length})
                                </Button>
                            </div>
                        </motion.aside>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
