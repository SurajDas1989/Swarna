"use client";

import { useState, useEffect } from "react";
import { useAppContext, Product } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getProductCategoryLabel } from "@/lib/productCategory";

export default function WishlistPage() {
    const { wishlist, toggleWishlist, addToCart, removeFromWishlist } = useAppContext();
    const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            if (wishlist.length === 0) {
                setWishlistProducts([]);
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/products/by-ids?ids=${wishlist.join(',')}`);
                if (res.ok) {
                    const data = await res.json();
                    setWishlistProducts(data);
                }
            } catch (error) {
                console.error("Failed to fetch wishlist products", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWishlist();
    }, [wishlist]);

    const handleMoveToCart = (productId: string) => {
        addToCart(productId);
        removeFromWishlist(productId);
    };

    return (
        <div className="container mx-auto px-4 py-16 min-h-[70dvh]">
            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Wishlist" },
                ]}
                currentPath="/wishlist"
                className="mb-6"
            />

            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-foreground">My Wishlist</h1>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 min-h-[40dvh]">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <p className="text-gray-500">Loading your favorites...</p>
                </div>
            ) : wishlistProducts.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-6xl mb-4">💔</div>
                    <h2 className="text-2xl font-semibold mb-2 text-foreground">Your Wishlist is Empty</h2>
                    <p className="text-gray-500 mb-8">Looks like you haven't liked any items yet.</p>
                    <Button asChild className="bg-primary hover:bg-primary-dark text-white px-8">
                        <Link href="/#products">Explore Collection</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {wishlistProducts.map((product) => {
                        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

                        return (
                            <div
                                key={product.id}
                                className="bg-background rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md border border-gray-100 flex flex-col"
                            >
                                {/* Product Image */}
                                <Link href={`/product/${product.id}`} className="block relative w-full h-[300px] overflow-hidden">
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-500 hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />

                                    {/* Unlike Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleWishlist(product.id);
                                        }}
                                        className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md text-red-500 hover:text-gray-400 hover:scale-110 transition-all z-10"
                                        aria-label="Remove from wishlist"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20" height="20" viewBox="0 0 24 24"
                                            fill="currentColor"
                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                        >
                                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                        </svg>
                                    </button>
                                </Link>

                                {/* Product Info */}
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">
                                        {getProductCategoryLabel(product.category)}
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-1">
                                        {product.name}
                                    </h3>

                                    {/* Rating */}
                                    <div className="flex items-center gap-1 mb-4 text-sm">
                                        <span className="text-yellow-400 text-lg tracking-widest">
                                            {'★'.repeat(Math.floor(product.rating))}
                                        </span>
                                        <span className="text-gray-500 ml-1">({product.rating})</span>
                                    </div>

                                    <div className="mt-auto">
                                        {/* Price */}
                                        <div className="flex items-center gap-3 mb-6">
                                            <span className="text-2xl font-bold text-primary">{"\u20B9"}{product.price}</span>
                                            <span className="text-base text-gray-400 line-through">{"\u20B9"}{product.originalPrice}</span>
                                            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold shrink-0">
                                                {discount}% OFF
                                            </span>
                                        </div>

                                        {/* Move to Cart */}
                                        <Button
                                            onClick={() => handleMoveToCart(product.id)}
                                            className="w-full bg-foreground hover:bg-primary text-white font-semibold py-6 transition-colors"
                                        >
                                            Move to Cart
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
