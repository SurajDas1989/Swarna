"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, OrderDetails } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, ShieldCheck, Truck, RotateCcw, LogIn, Plus, Home, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { formatInr } from "@/lib/utils";


// New components
import { CheckoutStepper, type CheckoutStep } from "@/components/checkout/CheckoutStepper";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { AddressForm, type AddressFormValues } from "@/components/checkout/AddressForm";
import { PaymentMethodSelector, type PaymentMethod } from "@/components/checkout/PaymentMethodSelector";
import { CouponInput } from "@/components/checkout/CouponInput";

interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayFailedResponse {
    error?: { description?: string };
}

interface Address {
    id: string;
    label: string | null;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    landmark: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    isDefault: boolean;
}

interface RazorpayInstance {
    on(event: 'payment.failed', callback: (response: RazorpayFailedResponse) => void): void;
    open(): void;
}

interface RazorpayConstructor {
    new(options: Record<string, unknown>): RazorpayInstance;
}

declare global {
    interface Window {
        Razorpay: RazorpayConstructor;
    }
}

export default function CheckoutPage() {
    const router = useRouter();
    const {
        cart,
        cartTotal,
        cartMRP,
        cartDiscount,
        deliveryCharge,
        cartFinalTotal,
        placeOrder,
        couponApplied,
        appliedCouponCode,
        couponDiscount,
        couponMaxDiscount,
        couponDiscountAmount,
        applyCoupon,
        removeCoupon
    } = useAppContext();
    const { user, loading } = useAuth();

    const [step, setStep] = useState<CheckoutStep>("address");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit-card");
    const [useStoreCredit, setUseStoreCredit] = useState(false);
    const [availableCredit, setAvailableCredit] = useState(0);
    const [addressData, setAddressData] = useState<AddressFormValues | null>(null);
    const [availableDiscount, setAvailableDiscount] = useState<{ code: string; percent: number } | null>(null);
    
    // Address Book State
    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [addressesLoading, setAddressesLoading] = useState(true);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);

    // Redirect if cart is empty
    useEffect(() => {
        if (cart.length === 0 && !isSubmitting && !loading) {
            router.push("/");
        }
    }, [cart, router, isSubmitting, loading]);

    // Fetch saved addresses
    useEffect(() => {
        if (!user) {
            setAddressesLoading(false);
            return;
        }

        fetch("/api/profile/addresses")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSavedAddresses(data);
                    // Pre-select default address if available
                    const defaultAddr = data.find(a => a.isDefault) || data[0];
                    if (defaultAddr) {
                        handleSelectSavedAddress(defaultAddr);
                    } else if (data.length === 0) {
                        setShowNewAddressForm(true);
                    }
                }
            })
            .catch(console.error)
            .finally(() => setAddressesLoading(false));
    }, [user]);

    // Pre-fill from user profile (fallback credit and user details)
    useEffect(() => {
        if (!user?.email) return;

        fetch("/api/profile")
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setAddressData(prev => prev || {
                        fullName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
                        email: user.email || "",
                        phone: data.phone || user.phone || "",
                        addressLine1: data.address ? data.address.split("\n")[0] : "",
                        addressLine2: "",
                        landmark: "",
                        city: "",
                        state: "",
                        zipCode: "",
                        addressType: "Home" as const,
                        deliveryInstructions: "",
                    });
                    if (data.storeCredit && Number(data.storeCredit) > 0) {
                        setAvailableCredit(Number(data.storeCredit));
                    }
                }
            })
            .catch(console.error);
    }, [user]);

    // Fetch available discount
    useEffect(() => {
        if (user) {
            fetch('/api/discount/available')
                .then(res => res.json())
                .then(data => {
                    if (data.available && data.code) {
                        setAvailableDiscount({ code: data.code, percent: data.discountPercent });
                    }
                })
                .catch(console.error);
        }
    }, [user]);

    // Calculate totals
    const couponAmt = Math.round(couponDiscountAmount);
    const afterCouponTotal = Math.max(0, cartTotal - couponAmt);

    const isEligibleForPrepaidDiscount =
        paymentMethod !== 'cod' && !useStoreCredit;

    const prepaidDiscountAmount = isEligibleForPrepaidDiscount
        ? Math.round(cartTotal * 0.05)
        : 0;

    // Delivery charge reassessment
    // Base amount for shipping threshold = cartTotal - coupon - prepaid discount
    const amountBeforeShipping = Math.max(0, cartTotal - couponAmt - prepaidDiscountAmount);
    const finalDeliveryCharge = (amountBeforeShipping > 0 && amountBeforeShipping < 799) ? 99 : 0;

    const finalCalculatedTotal = useStoreCredit
        ? Math.max(0, (amountBeforeShipping + finalDeliveryCharge) - availableCredit)
        : (amountBeforeShipping + finalDeliveryCharge);

    // Convert saved DB Address to AddressFormValues for order payload
    const handleSelectSavedAddress = (addr: Address) => {
        setAddressData({
            fullName: addr.fullName,
            email: user?.email || "",
            phone: addr.phone,
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2 || "",
            landmark: addr.landmark || "",
            city: addr.city || "",
            state: addr.state || "",
            zipCode: addr.pincode || "",
            addressType: (addr.label?.includes("office") || addr.label?.includes("work")) ? "Work" as const : "Home" as const,
            deliveryInstructions: "",
        });
    };

    // Handle address form submit (for new addresses, we don't save to db here, just use it for order)
    const handleAddressSubmit = (values: AddressFormValues) => {
        setAddressData(values);
        setStep("payment");
    };

    const proceedToPayment = () => {
        if (addressData) {
            setStep("payment");
        }
    };

    // Handle place order
    const handleSubmit = async () => {
        if (!addressData) return;
        setIsSubmitting(true);

        try {
            let dbOrderId: string | null = null;

            const names = addressData.fullName.trim().split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ') || ' ';

            const addressParts = [
                addressData.addressLine1,
                addressData.addressLine2,
                addressData.landmark ? `Landmark: ${addressData.landmark}` : '',
                `Type: ${addressData.addressType}`,
                addressData.deliveryInstructions ? `Instructions: ${addressData.deliveryInstructions}` : ''
            ].filter(Boolean).join(', ');

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                    total: amountBeforeShipping + finalDeliveryCharge,
                    shipping: {
                        firstName,
                        lastName,
                        email: addressData.email,
                        phone: addressData.phone,
                        address: addressParts,
                        city: addressData.city,
                        state: addressData.state,
                        pincode: addressData.zipCode,
                        country: "India"
                    },
                    paymentMethod,
                    useStoreCredit,
                    discountCode: appliedCouponCode || undefined,
                    mrpTotal: cartMRP,
                    discountOnMRP: cartDiscount,
                    shippingAmount: finalDeliveryCharge,
                }),
            });
            const dbOrder = await res.json();

            if (dbOrder.error) throw new Error(dbOrder.error);
            dbOrderId = dbOrder.id;

            const localOrderId = dbOrder.orderNumber || dbOrderId || `SW-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            if (paymentMethod === "cod" || finalCalculatedTotal === 0) {
                finalizeOrder(localOrderId, finalCalculatedTotal === 0 ? "store-credit" : "cod");
                return;
            }

            const orderRes = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: finalCalculatedTotal })
            });
            const rzpOrder = await orderRes.json();

            if (rzpOrder.error) throw new Error(rzpOrder.error);

            const options = {
                key: rzpOrder.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
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
                    name: addressData.fullName,
                    email: addressData.email,
                    contact: addressData.phone,
                },
                theme: { color: "#D4AF37" }
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
        if (!addressData) return;
        const names = addressData.fullName.trim().split(' ');

        const orderDetails: OrderDetails = {
            orderId,
            paymentId,
            paymentMethod,
            items: [...cart],
            total: cartTotal,
            mrpTotal: cartMRP,
            discountOnMRP: cartDiscount,
            couponDiscount: couponDiscountAmount,
            storeCreditUsed: useStoreCredit ? Math.min(amountBeforeShipping + finalDeliveryCharge, availableCredit) : 0,
            shipping: finalDeliveryCharge,
            finalTotal: finalCalculatedTotal,
            billingInfo: {
                firstName: names[0],
                lastName: names.slice(1).join(' ') || ' ',
                email: addressData.email,
                address: addressData.addressLine1,
                city: addressData.city,
                state: addressData.state,
                zipCode: addressData.zipCode
            }
        };

        placeOrder(orderDetails);
        router.push("/checkout/success");
    };

    // Loading state
    if (loading && !isSubmitting) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (cart.length === 0 && !isSubmitting) return null;

    // Not logged in
    if (!user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
                <LogIn className="h-12 w-12 text-primary" />
                <h2 className="text-xl font-semibold">Please log in to checkout</h2>
                <Link href="/login">
                    <Button size="lg">Log In</Button>
                </Link>
            </div>
        );
    }

    // Cart items for OrderSummary
    const summaryItems = cart.map((item: any) => ({
        id: item.id,
        name: item.name || item.title || "Product",
        image: item.image || item.images?.[0] || "/placeholder.svg",
        price: item.price,
        quantity: item.quantity,
        originalPrice: item.originalPrice || item.mrp,
    }));

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                    <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
                        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" /> Back to shop
                        </Link>
                        <Separator orientation="vertical" className="h-6" />
                        <h1 className="text-lg font-bold tracking-tight">
                            <span className="text-primary">Swarna</span> Checkout
                        </h1>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-6">
                    {/* Stepper */}
                    <div className="mb-8">
                        <CheckoutStepper
                            currentStep={step}
                            onStepClick={(s) => {
                                const order: CheckoutStep[] = ["cart", "address", "payment", "confirmation"];
                                if (order.indexOf(s) < order.indexOf(step)) setStep(s);
                            }}
                        />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                        {/* Left column */}
                        <div className="space-y-6">
                            {step === "address" && (
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-lg font-semibold">Delivery Address</h2>
                                            {savedAddresses.length > 0 && showNewAddressForm && (
                                                <Button variant="ghost" size="sm" onClick={() => setShowNewAddressForm(false)}>
                                                    Use Saved Address
                                                </Button>
                                            )}
                                        </div>

                                        {addressesLoading ? (
                                            <div className="space-y-4">
                                                <div className="h-32 bg-muted animate-pulse rounded-lg" />
                                            </div>
                                        ) : savedAddresses.length > 0 && !showNewAddressForm ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {savedAddresses.map((addr) => {
                                                        // Determine if this address is currently selected
                                                        const isSelected = addressData?.addressLine1 === addr.addressLine1 && addressData?.phone === addr.phone;
                                                        
                                                        return (
                                                            <div
                                                                key={addr.id}
                                                                onClick={() => handleSelectSavedAddress(addr)}
                                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                                    isSelected 
                                                                        ? "border-primary bg-primary/5" 
                                                                        : "border-border hover:border-primary/50"
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    {addr.label?.toLowerCase() === "home" ? (
                                                                        <Home className="w-4 h-4 text-muted-foreground" />
                                                                    ) : addr.label?.toLowerCase() === "office" || addr.label?.toLowerCase() === "work" ? (
                                                                        <Building2 className="w-4 h-4 text-muted-foreground" />
                                                                    ) : (
                                                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                                                    )}
                                                                    {addr.label && <span className="text-xs font-semibold text-muted-foreground uppercase">{addr.label}</span>}
                                                                    {addr.isDefault && <span className="ml-auto text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">Default</span>}
                                                                </div>
                                                                <p className="font-semibold text-sm">{addr.fullName}</p>
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                    {addr.addressLine1}
                                                                    {addr.addressLine2 && `, ${addr.addressLine2}`}
                                                                    {addr.landmark && ` (Near ${addr.landmark})`}
                                                                    <br />
                                                                    {addr.city}, {addr.state} - {addr.pincode}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">{addr.phone}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                <div className="flex gap-4 pt-4 border-t">
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => setShowNewAddressForm(true)}
                                                        className="w-full flex items-center justify-center gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                                    >
                                                        <Plus className="w-4 h-4" /> Add New Address
                                                    </Button>
                                                </div>
                                                
                                                <Button
                                                    className="w-full mt-4"
                                                    size="lg"
                                                    onClick={proceedToPayment}
                                                    disabled={!addressData}
                                                >
                                                    Deliver to this address
                                                </Button>
                                            </div>
                                        ) : (
                                            <AddressForm
                                                onSubmit={handleAddressSubmit}
                                                defaultValues={addressData || undefined}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {step === "payment" && (
                                <div className="space-y-6">
                                    {/* Address summary */}
                                    {addressData && (
                                        <Card className="border-primary/10 bg-primary/5">
                                            <CardContent className="flex items-start justify-between p-4">
                                                <div className="text-sm">
                                                    <p className="font-semibold">{addressData.fullName}</p>
                                                    <p className="text-muted-foreground">
                                                        {addressData.addressLine1}
                                                        {addressData.addressLine2 && `, ${addressData.addressLine2}`}
                                                    </p>
                                                    <p className="text-muted-foreground">
                                                        {addressData.city}, {addressData.state} - {addressData.zipCode}
                                                    </p>
                                                    <p className="text-muted-foreground">{addressData.phone}</p>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => setStep("address")} className="text-primary">
                                                    Change
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Payment methods */}
                                    <Card>
                                        <CardContent className="p-6">
                                            <PaymentMethodSelector
                                                selected={paymentMethod}
                                                onChange={setPaymentMethod}
                                            />
                                        </CardContent>
                                    </Card>

                                    {/* Store credit */}
                                    {availableCredit > 0 && (
                                        <Card>
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div>
                                                    <Label className="text-sm font-medium">Use Store Credit</Label>
                                                    <p className="text-xs text-muted-foreground">Available: {formatInr(availableCredit)}</p>
                                                </div>
                                                <Switch checked={useStoreCredit} onCheckedChange={setUseStoreCredit} />
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Coupon */}
                                    <Card>
                                        <CardContent className="p-4">
                                            <CouponInput
                                                appliedCode={appliedCouponCode || undefined}
                                                onApply={async (code) => {
                                                    const result = await applyCoupon(code);
                                                    return { valid: result.valid, error: result.error };
                                                }}
                                                onRemove={() => {
                                                    removeCoupon();
                                                }}
                                                availableDiscount={availableDiscount}
                                            />
                                        </CardContent>
                                    </Card>

                                    {/* Place order button */}
                                    <Button
                                        className="w-full text-base font-semibold"
                                        size="lg"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                                            </>
                                        ) : (
                                            `Pay ${formatInr(finalCalculatedTotal)}`
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Trust badges */}
                            <div className="grid grid-cols-3 gap-4 pt-2">
                                {[
                                    { icon: ShieldCheck, label: "Secure Payment" },
                                    { icon: Truck, label: "Free Shipping ≥₹799" },
                                    { icon: RotateCcw, label: "Easy Returns" },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="flex flex-col items-center gap-1.5 rounded-lg border bg-card p-3 text-center">
                                        <Icon className="h-5 w-5 text-primary" />
                                        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right column - Order Summary */}
                        <div className="lg:sticky lg:top-20 lg:self-start">
                            <OrderSummary
                                items={summaryItems}
                                mrpTotal={cartMRP}
                                discountOnMRP={cartDiscount}
                                couponCode={appliedCouponCode || undefined}
                                couponDiscount={Math.round(couponDiscountAmount)}
                                deliveryCharge={finalDeliveryCharge}
                                prepaidDiscount={prepaidDiscountAmount}
                                storeCreditUsed={useStoreCredit ? Math.min(amountBeforeShipping + finalDeliveryCharge, availableCredit) : 0}
                                finalTotal={finalCalculatedTotal}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
