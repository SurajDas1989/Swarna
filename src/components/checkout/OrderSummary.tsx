"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tag, Truck, CreditCard, Wallet } from "lucide-react";
import { formatInr } from "@/lib/utils";

interface CartItem {
    id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    originalPrice?: number;
}

interface OrderSummaryProps {
    items: CartItem[];
    mrpTotal: number;
    discountOnMRP: number;
    couponCode?: string;
    couponDiscount: number;
    deliveryCharge: number;
    prepaidDiscount: number;
    storeCreditUsed: number;
    finalTotal: number;
}

export function OrderSummary({
    items,
    mrpTotal,
    discountOnMRP,
    couponCode,
    couponDiscount,
    deliveryCharge,
    prepaidDiscount,
    storeCreditUsed,
    finalTotal,
}: OrderSummaryProps) {
    return (
        <Card className="border-primary/20 shadow-lg">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Items */}
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="flex flex-1 flex-col justify-center min-w-0">
                                <p className="truncate text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <div className="flex flex-col items-end justify-center">
                                <span className="text-sm font-semibold">{formatInr(item.price * item.quantity)}</span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                    <span className="text-xs text-muted-foreground line-through">
                                        {formatInr(item.originalPrice * item.quantity)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <Separator />

                {/* Price breakdown */}
                <div className="space-y-2 text-sm">
                    <Row label="Total MRP" value={formatInr(mrpTotal)} />
                    {discountOnMRP > 0 && (
                        <Row label="Discount on MRP" value={`-${formatInr(discountOnMRP)}`} className="text-green-600" />
                    )}
                    {couponDiscount > 0 && (
                        <Row
                            label={
                                <span className="flex items-center gap-1">
                                    <Tag className="h-3.5 w-3.5" />
                                    Coupon{couponCode && <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{couponCode}</Badge>}
                                </span>
                            }
                            value={`-${formatInr(couponDiscount)}`}
                            className="text-green-600"
                        />
                    )}
                    <Row
                        label={
                            <span className="flex items-center gap-1">
                                <Truck className="h-3.5 w-3.5" /> Delivery
                            </span>
                        }
                        value={deliveryCharge === 0 ? "FREE" : formatInr(deliveryCharge)}
                        className={deliveryCharge === 0 ? "text-green-600" : ""}
                    />
                    {prepaidDiscount > 0 && (
                        <Row
                            label={
                                <span className="flex items-center gap-1">
                                    <CreditCard className="h-3.5 w-3.5" /> Prepaid Discount (5%)
                                </span>
                            }
                            value={`-${formatInr(prepaidDiscount)}`}
                            className="text-green-600"
                        />
                    )}
                    {storeCreditUsed > 0 && (
                        <Row
                            label={
                                <span className="flex items-center gap-1">
                                    <Wallet className="h-3.5 w-3.5" /> Store Credit
                                </span>
                            }
                            value={`-${formatInr(storeCreditUsed)}`}
                            className="text-green-600"
                        />
                    )}
                </div>

                <Separator />

                {/* Final total */}
                <div className="flex items-center justify-between">
                    <span className="text-base font-bold">Total</span>
                    <span className="text-xl font-bold text-primary">{formatInr(finalTotal)}</span>
                </div>

                {/* Savings */}
                {(discountOnMRP + couponDiscount + prepaidDiscount + storeCreditUsed) > 0 && (
                    <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-center">
                        <span className="text-xs font-medium text-green-700">
                            🎉 You save {formatInr(discountOnMRP + couponDiscount + prepaidDiscount + storeCreditUsed)} on this order!
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Row({
    label,
    value,
    className,
}: {
    label: React.ReactNode;
    value: string;
    className?: string;
}) {
    return (
        <div className={`flex items-center justify-between ${className || ""}`}>
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}