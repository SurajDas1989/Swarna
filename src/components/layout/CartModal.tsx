"use client";

import { useAppContext } from "@/context/AppContext";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Trash2, ShoppingBag, Tag, ChevronRight, ClipboardList, Loader2, CheckCircle2, ChevronUp, ChevronDown, CreditCard, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { getBlurDataUrl } from "@/lib/utils/imageBlur";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { formatInr } from "@/lib/utils";
import { InputButtonGroup } from "@/components/layout/LayoutPrimitives";

export function CartModal() {
    const router = useRouter();
    const {
        cart,
        isCartOpen,
        setIsCartOpen,
        removeFromCart,
        updateCartQuantity,
        cartTotal,
        cartMRP,
        cartDiscount,
        deliveryCharge,
        cartFinalTotal,
        couponApplied,
        appliedCouponCode,
        couponDiscountAmount,
        applyCoupon,
        removeCoupon
    } = useAppContext();

    const [couponCode, setCouponCode] = useState("");
    const [couponError, setCouponError] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

    const prevCouponApplied = useRef<boolean | null>(null);

    useEffect(() => {
        // Initialize on first run
        if (prevCouponApplied.current === null) {
            prevCouponApplied.current = couponApplied;
            return;
        }

        if (couponApplied && !prevCouponApplied.current) {
            // Success burst from the center of the modal area
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { x: 0.8, y: 0.4 }, // Burst from the top-ish right where modal is
                colors: ['#d4af37', '#f59e0b', '#ffffff', '#1a1a1a'],
                disableForReducedMotion: true,
                zIndex: 10000 // Ensure it's above the modal (z-2000)
            });
        }
        prevCouponApplied.current = couponApplied;
    }, [couponApplied]);

    const handleCheckout = () => {
        setIsCartOpen(false);
        router.push("/checkout");
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError("");
        try {
            const result = await applyCoupon(couponCode.trim());
            if (!result.valid) {
                setCouponError(result.error || "Invalid coupon code");
            } else {
                setCouponCode("");
            }
        } catch (err) {
            setCouponError("Error applying coupon");
        } finally {
            setCouponLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <div className="fixed inset-0 z-[2000] flex justify-end">
                    {/* Overlay click to close */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsCartOpen(false)}
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="relative w-full max-w-[450px] bg-background h-[100dvh] shadow-2xl flex flex-col modal-container"
                    >

                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground tracking-tight">Your Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                                        {cartTotal > 0 && cartTotal < 799 
                                            ? `Add ${formatInr(799 - cartTotal)} for free shipping` 
                                            : "Free Shipping applied"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors group"
                            >
                                <X className="w-6 h-6 text-gray-400 group-hover:text-foreground transition-colors" />
                            </button>
                        </div>

                        {/* Cart Items Area */}
                        <div className="flex-1 overflow-y-auto bg-background p-0">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-6 space-y-4">
                                    <div className="mb-4 rounded-full bg-muted p-6">
                                        <ShoppingBag className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <p className="text-xl font-bold text-foreground">Your cart is empty</p>
                                    <p className="text-sm text-center">Your cart is currently empty. Add some products to the cart.</p>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="mt-8 px-10 py-3 bg-foreground text-white dark:bg-primary dark:text-background rounded-full font-bold uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95"
                                    >
                                        Explore Products
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-white/5 pb-20">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-4 p-5 animate-in fade-in slide-in-from-right-4 duration-300">
                                            {/* Item Image */}
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden relative shadow-sm shrink-0 border border-gray-100 dark:border-white/10 group">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    placeholder="blur"
                                                    blurDataURL={getBlurDataUrl()}
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                    sizes="100px"
                                                />
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 flex flex-col justify-between py-0.5">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-bold text-foreground text-sm sm:text-base line-clamp-2 leading-tight">{item.name}</h3>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{typeof item.category === 'string' ? item.category : item.category?.slug || item.category?.name || ''}</p>
                                                    <span className="text-[10px] text-green-500 font-bold">(50% OFF)</span>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center overflow-hidden rounded-lg border border-border bg-muted/70 scale-90 origin-left">
                                                        <button
                                                            className="px-2.5 py-1 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 transition-colors"
                                                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 py-1 text-xs font-bold min-w-[1.5rem] text-center border-x border-gray-100 dark:border-white/10">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            className="px-2.5 py-1 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 transition-colors"
                                                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-400 line-through">{formatInr(item.price * 2 * item.quantity)}</p>
                                                        <p className="font-black text-foreground text-sm sm:text-base tracking-tight">
                                                            {formatInr(item.price * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Coupon Section (Luxe Style) */}
                                    <div className="px-5 py-4 space-y-4">
                                        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
                                            {/* Decorative Background Flare */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl pointer-events-none" />
                                            
                                            {couponApplied ? (
                                                <div className="space-y-3 relative z-10">
                                                    <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-muted/70 p-3 backdrop-blur-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground scale-90 shadow-lg shadow-primary/20">
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black uppercase tracking-widest text-foreground">{appliedCouponCode} applied</p>
                                                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block uppercase tracking-wider">
                                                                    Saved {formatInr(couponDiscountAmount)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={removeCoupon}
                                                            className="group rounded-full p-2 transition-colors hover:bg-accent"
                                                        >
                                                            <X className="w-4 h-4 text-gray-400 group-hover:text-foreground" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-dashed border-border pt-2 text-[11px] font-bold">
                                                        <span className="text-primary/70">1 coupons available</span>
                                                        <button 
                                                            onClick={handleCheckout}
                                                            className="text-primary hover:text-primary-dark flex items-center gap-1 uppercase tracking-wider group transition-colors"
                                                        >
                                                            View Coupons 
                                                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 relative z-10">
                                                    <InputButtonGroup>
                                                        <div className="relative flex-1 min-w-0">
                                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                                <Tag className="w-4 h-4 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="ENTER COUPON CODE"
                                                                value={couponCode}
                                                                onChange={(e) => {
                                                                    setCouponCode(e.target.value.toUpperCase());
                                                                    setCouponError("");
                                                                }}
                                                                className="w-full pl-11 pr-4 py-4 text-[11px] font-bold bg-transparent outline-none uppercase tracking-[0.2em] placeholder:text-gray-400 placeholder:tracking-normal border border-gray-200 dark:border-white/10 rounded-l-xl focus:border-primary/50"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={handleApplyCoupon}
                                                            disabled={couponLoading || !couponCode.trim()}
                                                            className="px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:text-gray-400 text-primary hover:bg-primary/5 active:scale-95 border border-l-0 border-gray-200 dark:border-white/10 rounded-r-xl shrink-0"
                                                        >
                                                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Apply"}
                                                        </button>
                                                    </InputButtonGroup>
                                                    {couponError && (
                                                        <p className="text-[10px] font-bold text-red-500 px-1 uppercase tracking-wider flex items-center gap-1 mt-1 transition-all animate-in fade-in slide-in-from-top-1">
                                                            <div className="w-1 h-1 bg-red-500 rounded-full" />
                                                            {couponError}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="border-t border-border bg-background p-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                                {/* Collapsible Total Section */}
                                <div className="relative">
                                {/* Saved Badge (Header for the footer) */}
                                <div className="bg-primary text-primary-foreground py-2 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-inner">
                                    {formatInr(cartDiscount + couponDiscountAmount)} Saved so far!
                                </div>

                                    {/* Expandable Content (Order Summary) */}
                                    <AnimatePresence>
                                        {isSummaryExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden border-b border-border bg-muted/40"
                                            >
                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="font-black text-foreground text-xs uppercase tracking-[0.2em]">Order Summary</h3>
                                                        <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            {formatInr(cartDiscount + couponDiscountAmount)} saved so far
                                                        </span>
                                                    </div>

                                                    <div className="space-y-3.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                        <div className="flex justify-between items-center">
                                                            <span>MRP total</span>
                                                            <span className="text-foreground">{formatInr(cartMRP)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-primary/80">
                                                            <span>Discount on MRP</span>
                                                            <span>-{formatInr(cartDiscount)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span>Cart Subtotal</span>
                                                            <span className="text-foreground">{formatInr(cartTotal)}</span>
                                                        </div>
                                                        {couponApplied && couponDiscountAmount > 0 && (
                                                            <div className="flex justify-between items-center text-primary/80">
                                                                <span>Coupon ({appliedCouponCode})</span>
                                                                <span>-{formatInr(couponDiscountAmount)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center text-primary/80">
                                                            <span>Total discount</span>
                                                            <span>-{formatInr(cartDiscount + couponDiscountAmount)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span>Shipping Charges</span>
                                                            {deliveryCharge === 0 ? (
                                                                <span className="text-primary font-black uppercase tracking-tighter">FREE</span>
                                                            ) : (
                                                                <span className="text-foreground">{formatInr(deliveryCharge)}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between border-t border-dashed border-border pt-2 text-primary text-sm">
                                                            <span>Total savings</span>
                                                            <span className="font-black">{formatInr(cartDiscount + couponDiscountAmount)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Footer Action Area */}
                                    <div className="p-6 pt-8 space-y-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-8">
                                        {/* Estimated Total Bar */}
                                        <div 
                                            className="flex items-center justify-between cursor-pointer group"
                                            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-foreground/5 shadow-sm dark:bg-white/5">
                                                    <Wallet className="w-4 h-4 text-gray-500" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground text-[11px] uppercase tracking-wider">Estimated Total</span>
                                                    {isSummaryExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400 group-hover:-translate-y-0.5 transition-transform" />}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-[10px] text-gray-400 line-through decoration-gray-400/50 leading-none">{formatInr(cartMRP)}</span>
                                                    <span className="font-black text-foreground text-xl tracking-tighter">
                                                        {formatInr(cartFinalTotal)}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-bold text-primary uppercase leading-none mt-0.5">
                                                    ({Math.round(((cartDiscount + couponDiscountAmount) / cartMRP) * 100)}% OFF)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Smaller "Cute" Checkout Button */}
                                        <div className="pb-4">
                                            <button
                                                onClick={handleCheckout}
                                                className="w-full py-3.5 bg-foreground hover:bg-black text-background dark:text-primary font-black text-sm uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 px-6 shadow-xl shadow-black/10 active:scale-[0.98] group cta-element"
                                            >
                                                Checkout
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
