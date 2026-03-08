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
                                        <div key={item.id} className="flex gap-4 py-4 border-b">
                                            {/* Item Image */}
                                            <div className="w-24 h-24 rounded-lg overflow-hidden relative shadow-sm shrink-0">
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    placeholder="blur"
                                                    blurDataURL={getBlurDataUrl()}
                                                    className="object-cover"
                                                    sizes="96px"
                                                />
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-semibold text-foreground line-clamp-2 pr-4">{item.name}</h3>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">{item.category}</p>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center border dark:border-white/15 rounded-md bg-white dark:bg-white/5">
                                                        <button
                                                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors rounded-l-md"
                                                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 py-1 text-sm font-semibold min-w-[2rem] text-center border-x">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors rounded-r-md"
                                                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {/* Price */}
                                                    <p className="font-bold text-primary">₹{item.price * item.quantity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer / Summary if not empty */}
                        {cart.length > 0 && (
                            <div className="p-6 bg-gray-50 dark:bg-[#1e1e1e] border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                        <span>Subtotal</span>
                                        <span className="font-semibold text-foreground">₹{cartTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600 dark:text-gray-400 items-center">
                                        <span>Shipping</span>
                                        {deliveryCharge === 0 ? (
                                            <span className="font-semibold text-success">Free</span>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <span className="font-semibold text-foreground">₹{deliveryCharge}</span>
                                                <span className="text-xs text-primary mt-1">Add ₹{799 - cartTotal} more for Free Shipping!</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-4 border-t">
                                        <span>Total</span>
                                        <span className="text-primary">₹{cartFinalTotal}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    className="w-full py-4 bg-foreground dark:bg-primary hover:bg-primary dark:hover:bg-primary-dark text-white dark:text-background font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>Proceed to Checkout</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
