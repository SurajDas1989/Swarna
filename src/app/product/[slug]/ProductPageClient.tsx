"use client";

import { use, useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext, Product } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle, ChevronDown, ChevronRight, Copy, Flame, Gift, Heart, PackageCheck, RotateCcw, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { getBlurDataUrl } from "@/lib/utils/imageBlur";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdaptiveContainer, Row } from "@/components/layout/LayoutPrimitives";
import { PincodeEstimator } from "@/components/shipping/PincodeEstimator";
import { motion } from "framer-motion";

interface Coupon {
    id: string;
    code: string;
    discountPercent: number;
    maxDiscountAmount: number | null;
    expiresAt: string | null;
}

const RECENTLY_VIEWED_KEY = "jewelluxe_recently_viewed";

function getCategoryLabel(category: Product["category"]): string {
    if (typeof category === "string") return category;
    return category?.slug || category?.name || "";
}

function getDescriptionSentences(description: string): string[] {
    return description
        .split(/[.!?]+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
}

function toTitleCase(value: string): string {
    return value
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function getCategoryMood(categoryLabel: string): string {
    const category = categoryLabel.toLowerCase();

    if (category.includes("bracelet") || category.includes("bangle")) {
        return "A refined wrist accent that layers beautifully with everyday styling";
    }
    if (category.includes("necklace") || category.includes("chain")) {
        return "A graceful neckline detail that adds polished shine without feeling heavy";
    }
    if (category.includes("earring") || category.includes("jhumka")) {
        return "A face-framing statement with movement, sparkle, and festive charm";
    }
    if (category.includes("ring")) {
        return "A finishing touch designed to feel elegant, expressive, and easy to style";
    }
    if (category.includes("set")) {
        return "A coordinated jewellery story that makes dressing up feel effortless";
    }

    return "A premium artificial jewellery pick designed to elevate everyday dressing";
}

function getKeyFeatures(product: Product, categoryLabel: string): string[] {
    const sentences = getDescriptionSentences(product.description);

    return [
        `Category: ${toTitleCase(categoryLabel)}`,
        sentences[0]
            ? `Design: ${sentences[0]}`
            : `Design: Curated ${categoryLabel} styling with a refined finish`,
        product.price >= 799
            ? "Delivery: Eligible for free shipping on this order value"
            : "Delivery: Carefully packed and quality-checked before dispatch",
        `Appeal: Rated ${product.rating.toFixed(1)} for everyday-to-occasion styling`,
    ];
}

function getInfoSections(product: Product): Array<{
    id: string;
    title: string;
    icon: typeof Gift;
    lines: string[];
}> {
    return [
        {
            id: "offers",
            title: "Offers",
            icon: Gift,
            lines: [
                product.price >= 799 ? "Free shipping is available on this piece." : "Add more styles to reach the free shipping threshold of Rs 799.",
                "All prices are inclusive of applicable taxes.",
                "Approved return cases are handled as store credit according to policy.",
            ],
        },
        {
            id: "care",
            title: "Care",
            icon: Sparkles,
            lines: [
                "Store in a dry pouch or box after use.",
                "Avoid perfume, water, and harsh chemicals directly on the jewellery.",
                "Wipe gently with a soft cloth to maintain finish and shine.",
            ],
        },
        {
            id: "delivery-returns",
            title: "Delivery & Returns",
            icon: PackageCheck,
            lines: [
                "Each piece is quality-checked before dispatch.",
                "Claims are accepted only for damaged or incorrect items.",
                "Issues must be reported within 24 hours of delivery with a proper unboxing video.",
            ],
        },
        {
            id: "cancellation",
            title: "Cancellation",
            icon: RotateCcw,
            lines: [
                "Orders cannot be cancelled once dispatched.",
                "Before dispatch, cancellation requests are subject to approval.",
                "Shipping and return handling follow the published store policy.",
            ],
        },
    ];
}

function parseHighlightText(value: string) {
    const [titlePart, ...descriptionParts] = value.split(":");
    const title = (titlePart || "").trim();
    const description = descriptionParts.join(":").trim();

    return {
        title: title || value.trim(),
        description: description || "Styled from the product's saved highlight copy.",
    };
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { addToCart, toggleWishlist, isInWishlist, setIsCartOpen } = useAppContext();
    const { showToast } = useToast();
    const [activeThumb, setActiveThumb] = useState(0);
    const [openSection, setOpenSection] = useState("offers");

    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [publicCoupons, setPublicCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleCopyCode = useCallback((code: string) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            showToast(`Coupon code ${code} copied!`, "success");
            setTimeout(() => setCopiedCode(null), 3000);
        });
    }, [showToast]);

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollPosition = scrollRef.current.scrollLeft;
        const width = scrollRef.current.offsetWidth;
        const newIndex = Math.round(scrollPosition / width);
        if (newIndex !== activeThumb) {
            setActiveThumb(newIndex);
        }
    };

    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const [productRes, couponsRes] = await Promise.all([
                    fetch(`/api/products/${id}`),
                    fetch(`/api/discount/public`)
                ]);

                if (productRes.ok) {
                    const data = await productRes.json();
                    setProduct(data);

                    // Fetch related products using the dedicated endpoint
                    const relatedRes = await fetch(`/api/products/related?productId=${data.id}&limit=4`);
                    if (relatedRes.ok) {
                        const relatedData = await relatedRes.json();
                        setRelatedProducts(Array.isArray(relatedData) ? relatedData : []);
                    }
                }

                if (couponsRes.ok) {
                    const couponData = await couponsRes.json();
                    setPublicCoupons(Array.isArray(couponData) ? couponData : []);
                }
            } catch (err) {
                console.error("Failed to fetch page data", err);
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
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Skeleton className="aspect-[4/5] rounded-2xl sm:col-span-2 sm:aspect-[2.1/1.2]" />
                            <Skeleton className="aspect-[4/5] rounded-2xl" />
                            <Skeleton className="aspect-[4/5] rounded-2xl" />
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
                <div className="text-6xl mb-6">◦</div>
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
    const isOutOfStock = (product.stock ?? 0) <= 0;
    const galleryImages = (product.images && product.images.length > 0 ? product.images : [product.image]).slice(0, 3);

    const categoryLabel = getCategoryLabel(product.category);
    const keyFeatures = getKeyFeatures(product, categoryLabel);
    const productStory = product.story?.trim() || product.description || product.name;
    const styleHighlights = (product.highlights || []).map(parseHighlightText);
    const infoSections = getInfoSections(product);
    const soldCount = 40 + (product.id.length * 13) % 160;

    const handleBuyNow = async () => {
        if (isOutOfStock) return;
        const added = await addToCart(product.id);
        if (added) {
            router.push('/checkout');
        } else {
            showToast('Could not add to cart. Please try again.', 'error');
        }
    };

    return (
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(44,44,44,0.08),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.95),rgba(253,251,247,1))] dark:bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_30%),linear-gradient(to_bottom,rgba(26,26,26,1),rgba(26,26,26,1))] min-h-dvh pb-24 lg:pb-0">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[linear-gradient(to_bottom,rgba(212,175,55,0.08),transparent)]" />
            <div className="pointer-events-none absolute left-[-8rem] top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute right-[-6rem] top-48 h-72 w-72 rounded-full bg-black/5 blur-3xl dark:bg-white/5" />

            {/* Breadcrumb */}
            <div className="relative border-b border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-card/70">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link href="/#products" className="hover:text-primary transition-colors">Shop</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-primary font-medium capitalize">{categoryLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                </div>
            </div>

            {/* Product Details */}
            <AdaptiveContainer wide className="py-6 lg:py-10">
                <Row gap={6} className="lg:gap-12 items-start">

                    {/* LEFT — Image Gallery */}
                    <div className="w-full lg:w-[58%] lg:sticky lg:top-24 lg:h-fit">
                        {/* Mobile Swipe-able Gallery */}
                        <div className="sm:hidden mb-6 overflow-hidden">
                            <div 
                                ref={scrollRef}
                                onScroll={handleScroll}
                                className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-4 px-4 scroll-pl-4"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                {galleryImages.map((imageSrc, idx) => (
                                    <div 
                                        key={`${imageSrc}-${idx}`}
                                        className="relative flex-[0_0_88%] snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-card"
                                    >
                                        <div className="relative aspect-[4/5]">
                                            <Image
                                                src={imageSrc}
                                                alt={`${product.name} gallery view ${idx + 1}`}
                                                fill
                                                placeholder="blur"
                                                blurDataURL={getBlurDataUrl()}
                                                className="object-cover"
                                                sizes="88vw"
                                                priority={idx === 0}
                                            />
                                            {idx === 0 && (
                                                <span className="absolute left-4 top-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                                    {discount}% OFF
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Pagination Dots */}
                            {galleryImages.length > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    {galleryImages.map((_, idx) => (
                                        <motion.div 
                                            key={idx}
                                            initial={false}
                                            animate={{ 
                                                width: activeThumb === idx ? 20 : 6,
                                                backgroundColor: activeThumb === idx ? "var(--primary)" : "var(--muted-foreground, #a09888)"
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            className="h-1.5 rounded-full"
                                            style={{ opacity: activeThumb === idx ? 1 : 0.4 }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2">
                            {galleryImages.map((imageSrc, idx) => (
                                <div
                                    key={`${imageSrc}-${idx}`}
                                    className={`group relative overflow-hidden rounded-[1.75rem] border border-black/5 bg-white/90 shadow-[0_18px_60px_rgba(17,17,17,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-card/90 ${idx === 0 ? "sm:col-span-2" : ""}`}
                                >
                                    <div className={idx === 0 ? "aspect-[4/5] sm:aspect-[2.1/1.2]" : "aspect-[4/5]"}>
                                        <Image
                                            src={imageSrc}
                                            alt={`${product.name} gallery view ${idx + 1}`}
                                            fill
                                            placeholder="blur"
                                            blurDataURL={getBlurDataUrl()}
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes={idx === 0 ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                                            priority={idx === 0}
                                        />
                                    </div>
                                    {idx === 0 && (
                                        <span className="absolute top-5 left-5 rounded-full border border-white/20 bg-black/65 px-4 py-1.5 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
                                            {discount}% OFF
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT — Product Info */}
                    <div className="w-full lg:w-[42%] flex flex-col min-w-0">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                                Curated Edit
                            </span>
                            <span className="rounded-full border border-black/5 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                                {product.price >= 799 ? "Free shipping" : "Gift-ready"}
                            </span>
                            <span className="rounded-full border border-black/5 bg-white/80 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                                {discount}% off
                            </span>
                        </div>

                        {/* Category */}
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 font-semibold mb-2">
                            Swarna Jewellery
                        </p>

                        {/* Name */}
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 leading-tight">
                            {product.name}
                        </h1>

                        <p className="mb-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
                            {productStory}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
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
                        <div className="mb-4 mt-2 max-w-fit">
                            <div className="inline-block border-b-2 border-green-600 pb-0.5 mb-1.5">
                                <span className="text-green-600 font-bold text-sm tracking-wide">{discount}% OFF</span>
                            </div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-xl sm:text-2xl text-gray-500 line-through">{"\u20B9"}{product.originalPrice}</span>
                                <span className="text-3xl sm:text-4xl font-black text-foreground">{"\u20B9"}{product.price}</span>
                                <span className="text-green-600 font-bold text-sm">(Save {"\u20B9"}{product.originalPrice - product.price})</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">Inclusive of all taxes</div>
                            
                            {/* Free Delivery Badge */}
                            {product.price >= 799 && (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100 dark:border-emerald-800/30 mb-2">
                                    <Truck className="w-4 h-4" /> Free shipping on this piece
                                </div>
                            )}
                        </div>

                        <div className="mb-6 grid gap-3 sm:grid-cols-3">
                            {styleHighlights.map((item) => (
                                <div key={item.title} className="rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                                    <p className="mb-1 text-sm font-semibold text-foreground">{item.title}</p>
                                    <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{item.description}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mb-6 rounded-[1.75rem] border border-black/5 bg-white/85 p-5 shadow-[0_18px_60px_rgba(17,17,17,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-card/80">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
                                Product Story
                            </p>
                            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                {product.description}
                            </p>
                        </div>

                        <div className="hidden lg:grid grid-cols-2 gap-3 mb-6">
                            <Button
                                onClick={async () => {
                                    if (isOutOfStock) return;
                                    const added = await addToCart(product.id);
                                    if (added) {
                                        showToast(`${product.name} added to cart`, "cart");
                                        setIsCartOpen(true);
                                    } else {
                                        showToast("Could not add to cart. Please try again.", "error");
                                    }
                                }}
                                disabled={isOutOfStock}
                                className="h-14 rounded-2xl bg-black text-white hover:bg-black/90 dark:bg-primary dark:text-background dark:hover:bg-primary/90"
                            >
                                {isOutOfStock ? "OUT OF STOCK" : "Add To Cart"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleBuyNow}
                                disabled={isOutOfStock}
                                className="h-14 rounded-2xl border-black/10 bg-white/90 text-foreground shadow-sm hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            >
                                Buy Now
                            </Button>
                        </div>

                        <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-card">
                            <div>
                                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
                                    Piece Overview
                                </p>
                                <h2 className="max-w-xl text-xl font-semibold leading-tight text-foreground">
                                    {getCategoryMood(categoryLabel)}
                                </h2>
                            </div>
                            <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ${isOutOfStock
                                ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                                }`}>
                                {isOutOfStock ? "Out of Stock" : `In Stock: ${product.stock ?? 0}`}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gray-100 dark:bg-white/10 mb-6" />

                        {/* Action Buttons — Black Sticky Bar */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-card/95 backdrop-blur-md border-t border-gray-100 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 lg:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
                            <button
                                disabled={isOutOfStock}
                                onClick={async () => {
                                    if (isOutOfStock) return;
                                    const added = await addToCart(product.id);
                                    if (added) {
                                        showToast(`${product.name} added to cart`, 'cart');
                                        setIsCartOpen(true);
                                    } else {
                                        showToast('Could not add to cart. Please try again.', 'error');
                                    }
                                }}
                                className="w-full bg-black dark:bg-primary text-white dark:text-background hover:bg-black/90 transition-colors flex items-center justify-between px-6 py-4 rounded-md shadow-xl disabled:opacity-70 disabled:cursor-not-allowed cta-element"
                            >
                                <span className="text-base sm:text-lg font-bold tracking-wide">
                                    {isOutOfStock ? "OUT OF STOCK" : "Add To Cart"}
                                </span>
                                
                                {!isOutOfStock && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-px h-6 bg-white/30" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-base sm:text-lg font-bold">{"\u20B9"}{product.price}</span>
                                            <span className="text-sm text-gray-400 line-through md:inline hidden">{"\u20B9"}{product.originalPrice}</span>
                                        </div>
                                    </div>
                                )}
                            </button>
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

                        <div className="mb-6 rounded-[1.75rem] border border-black/5 bg-white/85 px-5 py-5 shadow-[0_18px_60px_rgba(17,17,17,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-card/80">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <h3 className="text-lg font-semibold text-foreground">Style Notes</h3>
                                <Sparkles className="h-4 w-4 text-primary/70" />
                            </div>
                            <div className="mb-4 flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                                <Link href="/#products" className="rounded-full bg-amber-50 px-3 py-1 font-medium capitalize text-primary transition-colors hover:bg-amber-100 dark:bg-primary/10 dark:hover:bg-primary/20">
                                    {categoryLabel}
                                </Link>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {["Jewellery", categoryLabel, "Premium", product.price >= 799 ? "Free shipping" : "Gift-ready"].map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-8">
                            {[
                                { icon: Truck, title: "Free Shipping", desc: "Above Rs 799" },
                                { icon: RotateCcw, title: "Return Support", desc: "24-hour claims" },
                                { icon: ShieldCheck, title: "Quality", desc: "Checked before dispatch" },
                            ].map((badge) => (
                                <div key={badge.title} className="text-center p-3 rounded-2xl border border-black/5 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
                                    <badge.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                                    <p className="text-xs font-semibold text-foreground">{badge.title}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{badge.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mb-8">
                            <PincodeEstimator />
                        </div>

                        <div className="mb-8">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
                                Helpful Details
                            </p>
                            <h2 className="mb-5 text-3xl font-semibold leading-tight text-foreground">
                                Care, delivery, and offers
                            </h2>
                            <div className="space-y-3">
                                {infoSections.map((section) => {
                                    const isOpen = openSection === section.id;
                                    return (
                                        <div key={section.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-card">
                                            <button
                                                type="button"
                                                onClick={() => setOpenSection(isOpen ? "" : section.id)}
                                                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                                            >
                                                <span className="flex items-center gap-3 text-sm font-semibold text-foreground">
                                                    <section.icon className="h-4 w-4 text-primary" />
                                                    {section.title}
                                                </span>
                                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                            </button>
                                            {isOpen && (
                                                <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600 dark:border-white/10 dark:text-gray-300">
                                                    {section.id === "offers" ? (
                                                        <div className="space-y-4">
                                                            {publicCoupons.length > 0 ? (
                                                                publicCoupons.map((coupon) => (
                                                                    <div
                                                                        key={coupon.id}
                                                                        className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-[#121212] p-4 shadow-xl transition-all hover:border-primary/40"
                                                                    >
                                                                        {/* Decorative radial gradient background */}
                                                                        <div className="absolute -right-4 -top-12 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                                                                        
                                                                        <div className="flex items-center justify-between gap-4">
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xl font-black tracking-tight text-primary">
                                                                                        {coupon.discountPercent}% OFF
                                                                                    </span>
                                                                                    <div className="h-4 w-px bg-primary/20" />
                                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                                                                                        Limited Offer
                                                                                    </span>
                                                                                </div>
                                                                                <p className="text-[12px] font-medium text-gray-400">
                                                                                    {coupon.maxDiscountAmount 
                                                                                        ? `Save up to ₹${coupon.maxDiscountAmount}` 
                                                                                        : "Valid on all orders above ₹799"}
                                                                                </p>
                                                                            </div>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleCopyCode(coupon.code)}
                                                                                className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold uppercase tracking-widest transition-all active:scale-95 ${
                                                                                    copiedCode === coupon.code
                                                                                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                                                                        : "border-primary/30 bg-primary/10 text-primary hover:bg-primary hover:text-black shadow-lg"
                                                                                }`}
                                                                            >
                                                                                {copiedCode === coupon.code ? (
                                                                                    <>
                                                                                        <CheckCircle className="h-3.5 w-3.5" />
                                                                                        COPIED
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Copy className="h-3.5 w-3.5" />
                                                                                        {coupon.code}
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                                                    <Sparkles className="h-8 w-8 text-gray-400 mb-3" />
                                                                    <p className="text-gray-400 font-medium">No active offers right now</p>
                                                                    <p className="text-[11px] text-gray-500 mt-1 max-w-[200px]">Check back later for exclusive Swarna discounts</p>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Static policy lines removed at user request */}
                                                        </div>
                                                    ) : (
                                                        <ul className="space-y-2">
                                                            {section.lines.map((line) => (
                                                                <li key={line} className="flex gap-2">
                                                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                                                                    <span>{line}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-card">
                            <h3 className="mb-4 text-xl font-semibold text-foreground">Key Features</h3>
                            <ul className="space-y-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                {keyFeatures.map((feature) => (
                                    <li key={feature} className="flex gap-3">
                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Row>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <div className="mb-6 flex items-end justify-between gap-4">
                            <div>
                                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
                                    Complete The Look
                                </p>
                                <h2 className="text-2xl font-bold text-foreground">Pieces that pair well with this one</h2>
                            </div>
                        </div>
                        <div className="flex overflow-x-auto gap-4 lg:gap-6 pb-4 snap-x hide-scrollbar">
                            {relatedProducts.map((rp) => {
                                const rpDiscount = Math.round(((rp.originalPrice - rp.price) / rp.originalPrice) * 100);
                                return (
                                    <Link
                                        key={rp.id}
                                        href={`/product/${rp.slug}`}
                                        className="shrink-0 w-[85%] sm:w-[45%] md:w-[30%] lg:w-[calc(25%-1.25rem)] lg:max-w-[320px] snap-start rounded-[1.5rem] overflow-hidden border border-black/5 bg-white/85 shadow-[0_16px_50px_rgba(17,17,17,0.08)] backdrop-blur-sm transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(17,17,17,0.12)] dark:border-white/10 dark:bg-card/85"
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
                                            <span className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/65 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
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

