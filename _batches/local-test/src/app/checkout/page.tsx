"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, OrderDetails } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { CreditCard, Truck, ShieldCheck, ArrowLeft, Loader2, LogIn, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayFailedResponse {
    error?: { description?: string };
}

interface RazorpayInstance {
    on(event: 'payment.failed', callback: (response: RazorpayFailedResponse) => void): void;
    open(): void;
}

interface RazorpayConstructor {
    new (options: Record<string, unknown>): RazorpayInstance;
}

declare global {
    interface Window {
        Razorpay: RazorpayConstructor;
    }
}

const INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const formatInr = (value: number) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
}).format(value);

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, cartTotal, deliveryCharge, cartFinalTotal, placeOrder } = useAppContext();
    const { user, loading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        paymentMethod: "credit-card"
    });

    useEffect(() => {
        if (cart.length === 0 && !isSubmitting && !loading) {
            router.push("/");
        }
    }, [cart, router, isSubmitting, loading]);

    useEffect(() => {
        if (!user?.email) return;

        setFormData(prev => ({
            ...prev,
            email: prev.email || user.email || "",
            phone: prev.phone || user.phone || "",
        }));

        fetch("/api/profile")
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setFormData(prev => ({
                        ...prev,
                        firstName: prev.firstName || data.firstName || "",
                        lastName: prev.lastName || data.lastName || "",
                        phone: prev.phone || data.phone || "",
                        address: prev.address || (data.address ? data.address.split("\n")[0] : "")
                    }));
                }
            })
            .catch(console.error);
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let dbOrderId: string | null = null;

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                    total: cartFinalTotal,
                    shipping: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.zipCode
                    },
                    paymentMethod: formData.paymentMethod,
                }),
            });
            const dbOrder = await res.json();

            if (dbOrder.error) {
                throw new Error(dbOrder.error);
            }

            dbOrderId = dbOrder.id;

            const localOrderId = dbOrder.orderNumber || dbOrderId || `SW-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            if (formData.paymentMethod === "cod") {
                finalizeOrder(localOrderId, "cod");
                return;
            }

            const orderRes = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: cartFinalTotal })
            });
            const rzpOrder = await orderRes.json();

            if (rzpOrder.error) throw new Error(rzpOrder.error);

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: "Swarna",
                description: "Purchase from Swarna",
                order_id: rzpOrder.id,
                handler: async function (response: RazorpaySuccessResponse) {
                    try {
                        if (dbOrderId) {
                            await fetch("/api/payment/verify", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderId: dbOrderId,
                                })
                            });
                        }
                        finalizeOrder(localOrderId, "credit-card", response.razorpay_payment_id);
                    } catch (err) {
                        console.error("Verification failed", err);
                        setIsSubmitting(false);
                    }
                },
                prefill: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    contact: formData.phone,
                },
                theme: {
                    color: "#D4AF37"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response: RazorpayFailedResponse) {
                console.error("Payment Failed", response.error);
                setIsSubmitting(false);
            });
            rzp.open();

        } catch (error) {
            console.error("Order failed:", error);
            setIsSubmitting(false);
        }
    };

    const finalizeOrder = (orderId: string, paymentMethod: string, paymentId?: string) => {
        const orderDetails: OrderDetails = {
            orderId,
            paymentId,
            paymentMethod,
            items: [...cart],
            total: cartTotal,
            shipping: deliveryCharge,
            finalTotal: cartFinalTotal,
            billingInfo: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zipCode: formData.zipCode
            }
        };

        placeOrder(orderDetails);
        router.push("/checkout/success");
    };

    if (loading && !isSubmitting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (cart.length === 0 && !isSubmitting) return null;

    return (
        <div className="bg-gray-50 dark:bg-background min-h-screen py-10">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="outline" size="icon" asChild className="rounded-full">
                        <Link href="/">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-foreground">Secure Checkout</h1>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-2/3 space-y-6">
                        {!user && (
                            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-5">
                                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-semibold text-foreground">Checkout Options</p>
                                        <p className="text-sm text-gray-500">You can place this order without creating an account.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-primary bg-primary/10 text-primary">
                                            <UserRound className="w-4 h-4" /> Continue as Guest
                                        </button>
                                        <Link href="/login?redirect=/checkout" className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/5">
                                            <LogIn className="w-4 h-4" /> Login for faster checkout
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-8">
                            <div className="mb-10">
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <Truck className="w-5 h-5 text-primary" />
                                    Shipping Details
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                        <input required type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/15 dark:text-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                        <input required type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/15 dark:text-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                        <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/15 dark:text-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                        <input required type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/15 dark:text-foreground" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                                        <input required type="text" name="address" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/15 dark:text-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                        <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/15 dark:text-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State / Province</label>
                                        <select
                                            required
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/15 dark:text-foreground appearance-none"
                                        >
                                            <option value="">Select State</option>
                                            {INDIAN_STATES.map(state => (
                                                <option key={state} value={state}>{state}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP / Postal Code</label>
                                        <input required type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:bg-white/5 dark:border-white/15 dark:text-foreground" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    Payment Method
                                </h2>
                                <div className="space-y-3">
                                    <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${formData.paymentMethod === "credit-card" ? "border-primary bg-primary/5" : "border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                                        <div className="flex items-center gap-3">
                                            <input type="radio" name="paymentMethod" value="credit-card" checked={formData.paymentMethod === "credit-card"} onChange={handleInputChange} className="w-4 h-4 text-primary focus:ring-primary" />
                                            <span className="font-medium">Credit / Debit Card / UPI</span>
                                        </div>
                                    </label>
                                    <label className={`block border rounded-lg p-4 cursor-pointer transition-colors ${formData.paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-gray-200 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-white/5"}`}>
                                        <div className="flex items-center gap-3">
                                            <input type="radio" name="paymentMethod" value="cod" checked={formData.paymentMethod === "cod"} onChange={handleInputChange} className="w-4 h-4 text-primary focus:ring-primary" />
                                            <span className="font-medium">Cash on Delivery</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-8 bg-foreground dark:bg-primary hover:bg-primary dark:hover:bg-primary-dark text-white py-6 text-lg font-bold"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Processing Order...</span>
                                ) : (
                                    <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Place Order - {formatInr(cartFinalTotal)}</span>
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="lg:w-1/3">
                        <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-white/10 p-6 sticky top-24">
                            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-16 rounded overflow-hidden relative shrink-0">
                                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                                            <div className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</div>
                                            <div className="font-semibold text-primary mt-1">{formatInr(item.price * item.quantity)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatInr(cartTotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    {deliveryCharge === 0 ? (
                                        <span className="text-success font-medium">Free</span>
                                    ) : (
                                        <span>{formatInr(deliveryCharge)}</span>
                                    )}
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-4 border-t">
                                    <span>Total</span>
                                    <span className="text-primary">{formatInr(cartFinalTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

