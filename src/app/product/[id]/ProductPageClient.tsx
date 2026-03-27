"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext, Product } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { ChevronDown, ChevronRight, Flame, Gift, Heart, PackageCheck, RotateCcw, ShieldCheck, ShoppingCart, Sparkles, Star, Truck, Zap } from "lucide-react";
import { getBlurDataUrl } from "@/lib/utils/imageBlur";
import { Skeleton } from "@/components/ui/Skeleton";
import { AdaptiveContainer, Row } from "@/components/layout/LayoutPrimitives";

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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { addToCart, toggleWishlist, isInWishlist, setIsCartOpen } = useAppContext();
    const { showToast } = useToast();
    const [activeThumb, setActiveThumb] = useState(0);
    const [openSection, setOpenSection] = useState("offers");

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

                    // Fetch related products using the dedicated endpoint
                    const relatedRes = await fetch(`/api/products/related?productId=${data.id}&limit=4`);
                    if (relatedRes.ok) {
                        const relatedData = await relatedRes.json();
                        setRelatedProducts(Array.isArray(relatedData) ? relatedData : []);
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
    const isOutOfStock = (product.stock ?? 0) <= 0;
    const galleryImages = (product.images && product.images.length > 0 ? product.images : [product.image]).slice(0, 3);
    const activeImage = galleryImages[Math.min(activeThumb, galleryImages.length - 1)] || product.image;

    const categoryLabel = getCategoryLabel(product.category);
    const keyFeatures = getKeyFeatures(product, categoryLabel);
    const infoSections = getInfoSections(product);
    const soldCount = 40 + (product.id.length * 13) % 160;

    const handleBuyNow = () => {
        if (isOutOfStock) return;
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
                        <span className="text-primary font-medium capitalize">{categoryLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
                    </div>
                </div>
            </div>

            {/* Product Details */}
            <AdaptiveContainer className="py-6 lg:py-10">
                <Row gap={6} className="lg:gap-12">

                    {/* LEFT — Image Gallery */}
                    <div className="w-full lg:w-1/2">
                        <div className="flex items-start gap-3 sm:hidden">
                            <div className="relative min-w-0 flex-[0_0_74%] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-card">
                                <div className="relative aspect-[4/4.6]">
                                    <Image
                                        src={activeImage}
                                        alt={`${product.name} main gallery view`}
                                        fill
                                        placeholder="blur"
                                        blurDataURL={getBlurDataUrl()}
                                        className="object-cover"
                                        sizes="74vw"
                                        priority
                                    />
                                    <span className="absolute left-3 top-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                        {discount}% OFF
                                    </span>
                                </div>
                            </div>
                            <div className="hide-scrollbar flex max-h-[23rem] flex-[0_0_26%] flex-col gap-3 overflow-y-auto pr-1">
                                {galleryImages.map((imageSrc, idx) => (
                                    <button
                                        key={`${imageSrc}-${idx}`}
                                        type="button"
                                        onClick={() => setActiveThumb(idx)}
                                        className={`relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all dark:bg-card ${
                                            activeThumb === idx
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-gray-200 dark:border-white/10"
                                        }`}
                                    >
                                        <div className="relative aspect-square">
                                            <Image
                                                src={imageSrc}
                                                alt={`${product.name} thumbnail ${idx + 1}`}
                                                fill
                                                placeholder="blur"
                                                blurDataURL={getBlurDataUrl()}
                                                className="object-cover"
                                                sizes="26vw"
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2">
                            {galleryImages.map((imageSrc, idx) => (
                                <div
                                    key={`${imageSrc}-${idx}`}
                                    className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/10 dark:bg-card ${idx === 0 ? "sm:col-span-2" : ""}`}
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
                                        <span className="absolute top-5 left-5 bg-red-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                            {discount}% OFF
                                        </span>
                                    )}
                                </div>
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

                        {/* Action Buttons — Side by Side */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-card/95 backdrop-blur-md border-t border-gray-100 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50 flex gap-3 lg:static lg:max-w-md lg:p-0 lg:bg-transparent lg:border-none lg:shadow-none lg:z-auto lg:mb-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
                            <Button
                                disabled={isOutOfStock}
                                onClick={() => {
                                    if (isOutOfStock) return;
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
                                disabled={isOutOfStock}
                                onClick={handleBuyNow}
                                className="flex-1 bg-foreground dark:bg-primary hover:bg-primary dark:hover:bg-primary-dark text-white dark:text-background font-semibold py-6 sm:py-7 text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl cta-element"
                            >
                                <Zap className="w-5 h-5 mr-2" />
                                <span className="truncate">{isOutOfStock ? "Out of Stock" : "Buy Now"}</span>
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

                        <div className="mb-6 rounded-2xl border border-gray-100 bg-white px-5 py-5 shadow-sm dark:border-white/10 dark:bg-card">
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <h3 className="text-lg font-semibold text-foreground">Explore this piece</h3>
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
                                <div key={badge.title} className="text-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                                    <badge.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
                                    <p className="text-xs font-semibold text-foreground">{badge.title}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{badge.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mb-8">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">
                                Helpful Details
                            </p>
                            <h2 className="mb-5 text-3xl font-semibold leading-tight text-foreground">
                                What makes this piece special
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
                                                    <ul className="space-y-2">
                                                        {section.lines.map((line) => (
                                                            <li key={line} className="flex gap-2">
                                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                                                                <span>{line}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
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

