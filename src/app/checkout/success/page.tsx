"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, OrderDetails } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Confetti from "react-confetti";
import { getOrderReference } from "@/lib/order-reference";

export default function OrderSuccessPage() {
    const router = useRouter();
    const { recentOrder } = useAppContext();
    const order: OrderDetails | null = recentOrder ?? null;

    const [windowSize, setWindowSize] = useState(() => ({
        width: typeof window !== "undefined" ? window.innerWidth : 0,
        height: typeof window !== "undefined" ? window.innerHeight : 0,
    }));

    const formatInr = (amount: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);

    useEffect(() => {
        const onResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        if (!recentOrder) {
            router.push("/");
        }
    }, [recentOrder, router]);

    if (!order) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white py-10 md:py-14">
            <Confetti
                width={windowSize.width}
                height={windowSize.height}
                recycle={false}
                numberOfPieces={120}
                gravity={0.12}
                colors={["#d4af37", "#b8962e", "#22c55e", "#3b82f6", "#f97316"]}
            />

            <div className="container mx-auto max-w-3xl px-4">
                <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-md md:p-10">
                    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />

                    <div className="relative z-10">
                        <div className="mb-5 flex justify-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </div>
                        </div>

                        <h1 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">Order Confirmed!</h1>
                        <p className="mx-auto mb-7 max-w-md text-gray-600">
                            Thank you for shopping with Swarna. Your beautifully crafted jewellery is being prepared for shipment.
                        </p>

                        <div className="mb-7 rounded-xl border border-stone-200 bg-stone-50 p-5 text-left md:p-6">
                            <div className="flex flex-col justify-between border-b border-stone-200 pb-5 md:flex-row">
                                <div>
                                    <p className="mb-1 text-sm text-gray-500">Order Number</p>
                                    <p className="text-lg font-bold text-gray-900">{getOrderReference({ orderId: order.orderId })}</p>
                                    {order.paymentId && (
                                        <p className="mt-2 text-xs text-gray-500">
                                            Payment ID: <span className="font-mono">{order.paymentId}</span>
                                        </p>
                                    )}
                                    <p className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                        {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid Online"}
                                    </p>
                                </div>
                                <div className="mt-4 text-left md:mt-0 md:text-right">
                                    <p className="mb-1 text-sm text-gray-500">Order Total</p>
                                    <p className="text-lg font-bold text-primary">{formatInr(order.finalTotal)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8 pt-5 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                                        <MapPin className="h-4 w-4 text-primary" /> Delivery Details
                                    </h3>
                                    <address className="not-italic text-sm leading-relaxed text-gray-700">
                                        {order.billingInfo.firstName} {order.billingInfo.lastName}
                                        <br />
                                        {order.billingInfo.address}
                                        <br />
                                        {order.billingInfo.city}, {order.billingInfo.state} {order.billingInfo.zipCode}
                                        <br />
                                        {order.billingInfo.email}
                                    </address>
                                </div>
                                <div>
                                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                                        <Package className="h-4 w-4 text-primary" /> Order Items & Summary
                                    </h3>
                                    
                                    <div className="space-y-3 mb-6">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 text-sm">
                                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-stone-200 shadow-sm">
                                                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="truncate text-gray-800">{item.name}</p>
                                                    <p className="text-gray-600">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                                        <div className="p-4">
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between text-gray-600">
                                                    <span>MRP total</span>
                                                    <span className="font-medium text-gray-900">{formatInr(order.mrpTotal || order.total)}</span>
                                                </div>
                                                
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Discount on MRP</span>
                                                    <span className="font-medium text-[#10b981]">
                                                        {order.discountOnMRP && order.discountOnMRP > 0 ? `-${formatInr(order.discountOnMRP)}` : `${formatInr(0)}`}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between text-gray-600">
                                                    <span>Cart Subtotal</span>
                                                    <span className="font-medium text-gray-900">{formatInr(order.total)}</span>
                                                </div>

                                                <div className="flex justify-between text-gray-600">
                                                    <span>Total discount</span>
                                                    <span className="font-medium text-[#10b981]">
                                                        {(order.discountOnMRP || 0) + (order.couponDiscount || 0) > 0 ? `-${formatInr((order.discountOnMRP || 0) + (order.couponDiscount || 0))}` : `${formatInr(0)}`}
                                                    </span>
                                                </div>

                                                {order.couponDiscount && order.couponDiscount > 0 ? (
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Coupon Discount</span>
                                                        <span className="font-medium text-[#10b981]">- {formatInr(order.couponDiscount)}</span>
                                                    </div>
                                                ) : null}

                                                <div className="flex justify-between text-gray-600 pb-3 border-b border-dashed border-stone-200">
                                                    <span>Shipping Charges</span>
                                                    {order.shipping === 0 ? (
                                                        <span className="font-bold text-[#10b981]">FREE</span>
                                                    ) : (
                                                        <span className="font-medium text-gray-900">{formatInr(order.shipping)}</span>
                                                    )}
                                                </div>

                                                {order.storeCreditUsed && order.storeCreditUsed > 0 ? (
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>Store Credit</span>
                                                        <span className="text-primary font-medium">-{formatInr(order.storeCreditUsed)}</span>
                                                    </div>
                                                ) : null}

                                                <div className="flex justify-between text-gray-600 pt-1">
                                                    <span>Total savings</span>
                                                    <span className="font-bold text-[#10b981]">
                                                        {(order.discountOnMRP || 0) + (order.couponDiscount || 0) > 0 ? `${formatInr((order.discountOnMRP || 0) + (order.couponDiscount || 0))}` : `${formatInr(0)}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <Button asChild className="rounded-full bg-gray-900 px-8 py-6 text-lg font-semibold text-white shadow-md transition-all hover:bg-primary hover:shadow-lg">
                                <Link href="/#products">Continue Shopping</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
