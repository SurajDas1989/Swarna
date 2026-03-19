"use client";

import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import { X, Trash2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { getBlurDataUrl } from "@/lib/utils/imageBlur";
import { motion, AnimatePresence } from "framer-motion";

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
        cartFinalTotal
    } = useAppContext();

    const handleCheckout = () => {
        setIsCartOpen(false);
        router.push("/checkout");
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
                        className="relative w-full max-w-[450px] bg-background h-full shadow-2xl flex flex-col"
                    >

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <ShoppingBag className="w-6 h-6" />
                                Your Cart
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Cart Items Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <ShoppingBag className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <p className="text-xl font-semibold text-foreground">Your cart is empty</p>
                                    <p className="text-sm">Looks like you haven't added anything yet.</p>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="mt-8 px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-colors"
                                    >
                                        Continue Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {cart.map((item) => (
                                        <div key={item.id} className="flex gap-3 sm:gap-4 py-4 border-b">
                                            {/* Item Image */}
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden relative shadow-sm shrink-0">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    placeholder="blur"
                                                    blurDataURL={getBlurDataUrl()}
                                                    className="object-cover"
                                                    sizes="(max-width: 640px) 80px, 96px"
                                                />
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 flex flex-col min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 pr-2">{item.name}</h3>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5">{item.category}</p>

                                                <div className="flex items-center justify-between mt-auto pt-3">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center border dark:border-white/15 rounded-md bg-white dark:bg-white/5 scale-90 sm:scale-100 origin-left">
                                                        <button
                                                            className="px-2 sm:px-3 py-0.5 sm:py-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors rounded-l-md"
                                                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold min-w-[1.5rem] sm:min-w-[2rem] text-center border-x">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            className="px-2 sm:px-3 py-0.5 sm:py-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors rounded-r-md"
                                                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {/* Price */}
                                                    <p className="font-bold text-primary text-sm sm:text-base">{"\u20B9"}{item.price * item.quantity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                            <div className="p-0 sm:p-0 bg-gray-50 dark:bg-[#1e1e1e] border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                {cartDiscount > 0 && (
                                    <div className="bg-[#10b981] text-white text-center py-1.5 text-xs sm:text-sm font-bold relative overflow-hidden flex items-center justify-center">
                                        <span className="relative z-10">{"\u20B9"}{cartDiscount.toLocaleString("en-IN")} Saved so far!</span>
                                    </div>
                                )}
                                
                                <div className="p-5 sm:p-6 pb-8 sm:pb-6">
                                    {deliveryCharge > 0 && (
                                        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
                                            <p className="text-xs sm:text-sm font-medium text-primary-dark">
                                                Add <span className="font-bold">{"\u20B9"}{799 - cartTotal}</span> more for Free Shipping!
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-white dark:bg-card border border-stone-200 dark:border-white/10 rounded-xl overflow-hidden mb-6">
                                        <div className="p-4 sm:p-5">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-foreground sm:text-lg">Order Summary</h3>
                                                {cartDiscount > 0 && (
                                                    <span className="bg-[#10b981]/10 text-[#10b981] text-xs font-semibold px-2 py-1 rounded">
                                                        {"\u20B9"}{cartDiscount.toLocaleString("en-IN")} saved so far
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-3 text-sm sm:text-base">
                                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                    <span>MRP total</span>
                                                    <span className="font-medium text-foreground">{"\u20B9"}{cartMRP.toLocaleString("en-IN")}</span>
                                                </div>
                                                
                                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                    <span>Discount on MRP</span>
                                                    <span className="font-medium text-[#10b981]">
                                                        {cartDiscount > 0 ? `-\u20B9${cartDiscount.toLocaleString("en-IN")}` : `\u20B90`}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                    <span>Cart Subtotal</span>
                                                    <span className="font-medium text-foreground">{"\u20B9"}{cartTotal.toLocaleString("en-IN")}</span>
                                                </div>

                                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                                    <span>Total discount</span>
                                                    <span className="font-medium text-[#10b981]">
                                                        {cartDiscount > 0 ? `-\u20B9${cartDiscount.toLocaleString("en-IN")}` : `\u20B90`}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between text-gray-600 dark:text-gray-400 pb-3 border-b border-dashed border-stone-200 dark:border-white/10">
                                                    <span>Shipping Charges</span>
                                                    {deliveryCharge === 0 ? (
                                                        <span className="font-bold text-[#10b981]">FREE</span>
                                                    ) : (
                                                        <span className="font-medium text-foreground">{"\u20B9"}{deliveryCharge}</span>
                                                    )}
                                                </div>

                                                <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-1">
                                                    <span>Total savings</span>
                                                    <span className="font-bold text-[#10b981]">
                                                        {cartDiscount > 0 ? `\u20B9${cartDiscount.toLocaleString("en-IN")}` : `\u20B90`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-stone-50 dark:bg-white/5 p-4 sm:p-5 flex justify-between items-center border-t border-stone-200 dark:border-white/10">
                                            <span className="font-bold text-foreground text-base sm:text-lg">Estimated Total</span>
                                            <span className="font-bold text-foreground text-lg sm:text-xl">{"\u20B9"}{cartFinalTotal.toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCheckout}
                                        className="w-full py-3.5 sm:py-4 bg-foreground dark:bg-primary hover:bg-primary dark:hover:bg-primary-dark text-white dark:text-background font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                    >
                                        <span>Proceed to Checkout</span>
                                    </button>
                                </div>
                            </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
