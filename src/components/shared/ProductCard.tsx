"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Heart, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext, Product } from "@/context/AppContext";
import { useToast } from "@/components/ui/Toast";
import { getBlurDataUrl } from "@/lib/utils/imageBlur";

interface ProductCardProps {
    product: Product;
    priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
    const { toggleWishlist, isInWishlist, addToCart } = useAppContext();
    const { showToast } = useToast();
    const [isHovered, setIsHovered] = useState(false);
    const [isAdded, setIsAdded] = useState(false);

    const isOutOfStock = (product.stock ?? 0) <= 0;
    const hasDiscount = product.originalPrice > product.price;

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isAdded || isOutOfStock) return;

        const added = await addToCart(product.id);
        if (added) {
            setIsAdded(true);
            showToast(`Added ${product.name} to cart`, "success");
            setTimeout(() => setIsAdded(false), 2000);
        } else {
            showToast(`Could not add ${product.name}`, "error");
        }
    };

    const handleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const alreadyLiked = isInWishlist(product.id);
        toggleWishlist(product.id);
        showToast(
            alreadyLiked ? "Removed from Wishlist" : "Added to Wishlist", 
            alreadyLiked ? "wishlist" : "success"
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-500 hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(184,150,46,0.1)] dark:border-white/5 dark:bg-card dark:hover:border-primary/30"
        >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-[#F8F8F8] dark:bg-black/20">
                {/* Badges */}
                <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
                    {hasDiscount && (
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm"
                        >
                            -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                        </motion.div>
                    )}
                    {product.isFeatured && (
                        <div className="rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm uppercase tracking-wider">
                            Featured
                        </div>
                    )}
                </div>

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlist}
                    className={`absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
                        isInWishlist(product.id) 
                        ? "bg-red-500 text-white" 
                        : "bg-white/80 text-gray-900 hover:bg-white hover:text-red-500"
                    }`}
                >
                    <motion.div
                        animate={isInWishlist(product.id) ? { scale: [1, 1.2, 1] } : {}}
                    >
                        <Heart className={`h-4.5 w-4.5 ${isInWishlist(product.id) ? "fill-current" : ""}`} />
                    </motion.div>
                </button>

                {/* Product Image */}
                <Link href={`/product/${product.id}`} className="block h-full w-full">
                    <motion.div
                        animate={{ scale: isHovered ? 1.08 : 1 }}
                        transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }}
                        className="h-full w-full"
                    >
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            priority={priority}
                            className="object-contain p-6 drop-shadow-2xl transition-opacity duration-500 lg:p-10"
                            placeholder="blur"
                            blurDataURL={getBlurDataUrl()}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                        />
                    </motion.div>
                </Link>

                {/* Quick Add Overlay (Desktop Only) */}
                <AnimatePresence>
                    {isHovered && !isAdded && !isOutOfStock && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute inset-x-0 bottom-0 hidden p-4 lg:block"
                        >
                            <Button
                                onClick={handleAddToCart}
                                className="w-full bg-white/95 text-gray-900 shadow-xl backdrop-blur-md hover:bg-primary hover:text-white font-bold tracking-wide transition-all h-11"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Quick Add
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success Indicator */}
                <AnimatePresence>
                    {isAdded && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="absolute inset-0 z-40 flex items-center justify-center bg-emerald-600/90 backdrop-blur-sm"
                        >
                            <div className="text-center text-white">
                                <Check className="mx-auto h-12 w-12 mb-2" />
                                <p className="font-bold uppercase tracking-widest text-xs">Added to Cart</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/50 backdrop-blur-[2px]">
                        <span className="rounded-full bg-gray-900/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="flex flex-1 flex-col p-4 pt-5 lg:p-6 lg:pt-6">
                <Link href={`/product/${product.id}`} className="mb-2 block group-hover:text-primary transition-colors">
                    <h3 className="line-clamp-2 text-sm font-medium leading-relaxed text-gray-900 dark:text-gray-100 lg:text-base">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-gray-900 dark:text-white lg:text-xl">
                                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.price)}
                            </span>
                            {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through lg:text-sm">
                                    {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.originalPrice)}
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mt-1">
                            {product.category_slug || (typeof product.category === 'string' ? product.category : product.category?.name || product.category?.slug) || 'Jewellery'}
                        </p>
                    </div>

                    {/* Mobile Compact Buy Button */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isAdded || isOutOfStock}
                        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 lg:hidden ${
                            isAdded
                            ? "bg-emerald-600 text-white"
                            : isOutOfStock
                                ? "bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-gray-600"
                            : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                        }`}
                    >
                        {isAdded ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
