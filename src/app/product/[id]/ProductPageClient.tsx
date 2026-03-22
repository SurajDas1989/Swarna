"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext, Product } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { Heart, ShoppingCart, Star, Truck, ShieldCheck, RotateCcw, Flame, ChevronRight, Zap } from "lucide-react";
import { getBlurDataUrl } from "@/lib/utils/imageBlur";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdaptiveContainer, Row, Stack } from "@/components/layout/LayoutPrimitives";

const RECENTLY_VIEWED_KEY = "jewelluxe_recently_viewed";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { addToCart, toggleWishlist, isInWishlist, setIsCartOpen } = useAppContext();
    const { showToast } = useToast();
    const [activeThumb, setActiveThumb] = useState(0);

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`/api/products/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProduct(data);

                    // Fetch related products (using general products API)
                    const relatedRes = await fetch(`/api/products?category=${data.category}`);
                    if (relatedRes.ok) {
                        const relatedData = await relatedRes.json();
                        setRelatedProducts(relatedData.filter((p: Product) => p.id !== data.id).slice(0, 4));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch product", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    useEffect(() => {
        if (!product) return;

        try {
            const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
            const existing = raw ? (JSON.parse(raw) as Product[]) : [];
            const clean = Array.isArray(existing) ? existing.filter((p) => p.id !== product.id) : [];
            const next = [product, ...clean].slice(0, 8);
            localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
        } catch (error) {
            console.error("Failed to save recently viewed product", error);
        }
    }, [product]);

    if (isLoading) {
        return (
            <div className="bg-gray-50 dark:bg-background min-h-dvh pb-24 lg:pb-0">
                {/* Breadcrumb Skeleton */}
                <div className="bg-white dark:bg-card border-b dark:border-white/10 p-4">
                    <div className="container mx-auto flex gap-2">
                        <Skeleton className="w-16 h-4" />
                        <Skeleton className="w-16 h-4" />
                        <Skeleton className="w-32 h-4" />
                    </div>
                </div>

                <div className="container mx-auto px-4 py-6 lg:py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                        {/* Left: Images Skeleton */}
                        <div className="space-y-4">
                            <Skeleton className="w-full aspect-square rounded-2xl" />
                            <div className="flex gap-3 overflow-hidden">
                                <Skeleton className="w-20 h-20 rounded-xl" />
                                <Skeleton className="w-20 h-20 rounded-xl" />
                                <Skeleton className="w-20 h-20 rounded-xl" />
                                <Skeleton className="w-20 h-20 rounded-xl" />
                            </div>
                        </div>

                        {/* Right: Info Skeleton */}
                        <div className="flex flex-col pt-4">
                            <Skeleton className="w-32 h-4 mb-4" />
                            <Skeleton className="w-3/4 h-10 mb-6" />
                            <Skeleton className="w-48 h-6 mb-8" />

                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-5 mb-8 border border-gray-100 dark:border-white/10">
                                <Skeleton className="w-40 h-10 mb-2" />
                                <Skeleton className="w-64 h-5" />
                            </div>

                            <div className="space-y-3 mb-10">
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-4/5 h-4" />
                            </div>

                            <div className="flex gap-3 mb-8">
                                <Skeleton className="flex-1 h-14 rounded-md" />
                                <Skeleton className="flex-1 h-14 rounded-md" />
                            </div>

                            <Skeleton className="w-48 h-6 mb-8" />

                            <div className="grid grid-cols-3 gap-3">
                                <Skeleton className="h-24 rounded-xl" />
                                <Skeleton className="h-24 rounded-xl" />
                                <Skeleton className="h-24 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-20 text-center min-h-[60dvh] flex flex-col items-center justify-center">
                <div className="text-6xl mb-6">ðŸ˜•</div>
                <h1 className="text-3xl font-bold mb-4 text-foreground">Product Not Found</h1>
                <p className="text-gray-500 mb-8">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                <Button asChild className="bg-primary hover:bg-primary-dark text-white">
                    <Link href="/#products">Back to Shop</Link>
                </Button>
            </div>
        );
    }

    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    const isLiked = isInWishlist(product.id);

    // Generate fake SKU from product
    const sku = `SW-${product.category.slice(0, 3).toUpperCase()}${product.id.toString().padStart(4, '0')}`;
    // Fake sold count (using string length as a deterministic seed)
    const soldCount = 40 + (product.id.length * 13) % 160;

    const handleBuyNow = () => {
        addToCart(product.id);
        router.push('/checkout');
    };

    return (
        <div className="bg-gray-50 dark:bg-background min-h-dvh pb-24 lg:pb-0">
            {/* Breadcrumb */}
            <div className="bg-white dark:bg-card border-b dark:border-white/10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link href="/#products" className="hover:text-primary transition-colors">Shop</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-primary font-medium capitalize">{product.category}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                </div>
            </div>

            {/* Product Details */}
            <AdaptiveContainer className="py-6 lg:py-10">
                <Row gap={6} className="lg:gap-12">

                    {/* LEFT — Image Gallery */}
                    <div className="w-full lg:w-1/2 space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-square bg-white dark:bg-card rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm group">
                            <Image
                                src={product.image}
                                alt={`${product.name} - Premium Artificial Jewellery | Swarna`}
                                fill
                                placeholder="blur"
                                blurDataURL={getBlurDataUrl()}
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                priority
                            />
                            {/* Discount Badge */}
                            <span className="absolute top-5 left-5 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                {discount}% OFF
                            </span>
                        </div>

                    {/* Thumbnail Strip */}
                        <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar">
                            {[0, 1, 2, 3].map((idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveThumb(idx)}
                                    className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${activeThumb === idx
                                        ? 'border-primary shadow-md ring-2 ring-primary/20'
                                        : 'border-gray-200 dark:border-white/10 hover:border-primary/50 opacity-70 hover:opacity-100'
                                        }`}
                                >
                                    <Image
                                        src={product.image}
                                        alt={`${product.name} detailed view ${idx + 1} - Artificial Jewellery`}
                                        fill
                                        placeholder="blur"
                                        blurDataURL={getBlurDataUrl()}
                                        className="object-cover"
                                        sizes="80px"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT — Product Info */}
                    <div className="w-full lg:w-1/2 flex flex-col min-w-0">
                        {/* Category */}
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-semibold mb-2">
                            Swarna Jewellery
                        </p>

                        {/* Name */}
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight">
                            {product.name}
                        </h1>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-4 h-4 ${star <= Math.floor(product.rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : star <= product.rating + 0.5
                                                ? 'fill-yellow-400/50 text-yellow-400'
                                                : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="font-semibold text-foreground text-sm">{product.rating}</span>
                            <span className="text-gray-400 text-sm">Rating</span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="text-gray-400 text-sm">(128 reviews)</span>
                        </div>

                        {/* Price Block */}
                        <div className="bg-gray-50/50 dark:bg-white/5 rounded-xl p-5 mb-6">
                            <div className="flex items-baseline gap-3 mb-1">
                                <span className="text-3xl sm:text-4xl font-bold text-primary">{"\u20B9"}{product.price}</span>
                                <span className="text-lg text-gray-400 line-through">{"\u20B9"}{product.originalPrice}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                    Save {"\u20B9"}{product.originalPrice - product.price}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Inclusive of all taxes</span>
                            </div>
                            {/* Relocated Free Delivery Badge */}
                            {product.price >= 799 && (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100 dark:border-emerald-800/30">
                                    <Truck className="w-4 h-4" /> Free Delivery
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-sm sm:text-base max-w-prose">
                            {product.description}
                        </p>

                        {/* Divider */}
                        <div className="h-px bg-gray-100 dark:bg-white/10 mb-6" />

                        {/* Action Buttons — Side by Side */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-card/95 backdrop-blur-md border-t border-gray-100 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 flex gap-3 lg:static lg:max-w-md lg:p-0 lg:bg-transparent lg:border-none lg:shadow-none lg:z-auto lg:mb-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
                            <Button
                                onClick={() => {
                                    addToCart(product.id);
                                    showToast(`${product.name} added to cart`, 'cart');
                                    setIsCartOpen(true);
                                }}
                                variant="outline"
                                className="flex-1 border-2 border-foreground dark:border-primary text-foreground dark:text-primary hover:bg-foreground hover:text-white dark:hover:bg-primary dark:hover:text-background font-semibold py-6 sm:py-7 text-sm sm:text-base transition-all duration-300 cta-element"
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                <span className="truncate">Add to Cart</span>
                            </Button>
                            <Button
                                onClick={handleBuyNow}
                                className="flex-1 bg-foreground dark:bg-primary hover:bg-primary dark:hover:bg-primary-dark text-white dark:text-background font-semibold py-6 sm:py-7 text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl cta-element"
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                <span className="truncate">Buy Now</span>
                            </Button>
                        </div>

                        {/* Wishlist & Share */}
                        <button
                            onClick={() => {
                                toggleWishlist(product.id);
                                showToast(
                                    isInWishlist(product.id) ? `Removed from wishlist` : `Added to wishlist`,
                                    'wishlist'
                                );
                            }}
                            className={`flex items-center gap-2 text-sm font-medium transition-colors mb-6 group w-fit ${isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                                }`}
                        >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''} group-hover:scale-110 transition-transform`} />
                            {isLiked ? 'ADDED TO WISHLIST' : 'ADD TO WISHLIST'}
                        </button>

                        {/* Social Proof */}
                        <div className="flex items-center gap-2 mb-6 text-sm">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">{soldCount} sold</span>
                            <span className="text-gray-500 dark:text-gray-400">in the last 24 hours</span>
                        </div>

                        {/* Meta Info */}
                        <div className="space-y-2 text-sm border-t border-gray-100 dark:border-white/10 pt-5 mb-6">
                            <div className="flex gap-2">
                                <span className="text-gray-500 dark:text-gray-400 w-24">SKU:</span>
                                <span className="text-foreground font-medium">{sku}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-500 dark:text-gray-400 w-24">Category:</span>
                                <Link href="/#products" className="text-primary font-medium capitalize hover:underline">{product.category}</Link>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-gray-500 dark:text-gray-400 w-24">Tags:</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {['Jewellery', product.category, 'Premium', 'Gift'].map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded text-xs capitalize">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { icon: Truck, title: 'Free Shipping', desc: 'Orders above \u20B9799' },
                                { icon: RotateCcw, title: 'Easy Returns', desc: '7 day policy' },
                                { icon: ShieldCheck, title: 'Quality', desc: 'Guaranteed' },
                            ].map((badge) => (
                                <div key={badge.title} className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                    <badge.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                                    <p className="text-xs font-semibold text-foreground">{badge.title}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{badge.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Row>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-foreground mb-8">You May Also Like</h2>
                        <div className="flex overflow-x-auto gap-4 lg:gap-6 pb-4 snap-x hide-scrollbar">
                            {relatedProducts.map((rp) => {
                                const rpDiscount = Math.round(((rp.originalPrice - rp.price) / rp.originalPrice) * 100);
                                return (
                                    <Link
                                        key={rp.id}
                                        href={`/product/${rp.id}`}
                                        className="shrink-0 w-[70%] sm:w-[45%] md:w-[30%] lg:flex-1 snap-start bg-white dark:bg-card rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/10 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="relative aspect-square overflow-hidden">
                                            <Image
                                                src={rp.image}
                                                alt={`${rp.name} - Premium Artificial Jewellery`}
                                                fill
                                                placeholder="blur"
                                                blurDataURL={getBlurDataUrl()}
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            />
                                            <span className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                                                {rpDiscount}% OFF
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                                {rp.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-primary">{"\u20B9"}{rp.price}</span>
                                                <span className="text-sm text-gray-400 line-through">{"\u20B9"}{rp.originalPrice}</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </AdaptiveContainer>
        </div>
    );
}

