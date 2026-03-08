"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    User, Mail, Phone, MapPin, Package, ArrowLeft, Loader2, Save,
    CheckCircle2, Clock, Truck, XCircle, ShoppingBag, ChevronDown, ChevronUp, Heart
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAppContext, Product } from "@/context/AppContext";
import { getOrderReference } from "@/lib/order-reference";

interface UserProfile {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
}

interface OrderItem {
    id: string;
    quantity: number;
    price: string;
    product: {
        id: string;
        name: string;
        images: string[];
        slug: string;
    };
}

interface Order {
    id: string;
    orderNumber?: string | null;
    status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    total: string;
    createdAt: string;
    items: OrderItem[];
}

const STATUS_CONFIG = {
    PENDING: { label: "Pending", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
    PROCESSING: { label: "Processing", icon: Loader2, color: "bg-blue-100 text-blue-700 border-blue-200" },
    SHIPPED: { label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-700 border-purple-200" },
    DELIVERED: { label: "Delivered", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
    CANCELLED: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" },
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { wishlist, addToCart, removeFromWishlist } = useAppContext();
    const ordersRef = useRef<HTMLDivElement>(null);

    // Profile state
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [profileError, setProfileError] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
    });

    // Orders state
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    // Active tab
    const [activeTab, setActiveTab] = useState<"profile" | "orders" | "wishlist">("profile");
    const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [authLoading, user, router]);

    // Handle hash navigation
    useEffect(() => {
        if (window.location.hash === "#orders") {
            setActiveTab("orders");
        } else if (window.location.hash === "#wishlist") {
            setActiveTab("wishlist");
        }
    }, []);

    // Fetch profile
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setProfile(data);
                    setFormData({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        phone: data.phone || "",
                        address: data.address || "",
                    });
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setProfileLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    // Fetch orders
    useEffect(() => {
        if (!user) return;

        const fetchOrders = async () => {
            try {
                const res = await fetch("/api/orders");
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (err) {
                console.error("Failed to load orders:", err);
            } finally {
                setOrdersLoading(false);
            }
        };

        fetchOrders();
    }, [user]);

    // Fetch wishlist products by IDs (independent of global search/filter)
    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (wishlist.length === 0) {
                setWishlistProducts([]);
                return;
            }

            try {
                const params = new URLSearchParams();
                params.set("ids", wishlist.join(","));
                const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
                if (!res.ok) {
                    setWishlistProducts([]);
                    return;
                }

                const data = await res.json();
                setWishlistProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load wishlist products:", err);
                setWishlistProducts([]);
            }
        };

        fetchWishlistProducts();
    }, [wishlist]);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSaveSuccess(false);
        setProfileError("");
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveSuccess(false);
        setProfileError("");

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const updated = await res.json();
                setProfile(updated);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                setProfileError("Failed to save profile. Please try again.");
            }
        } catch (err) {
            setProfileError("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(parseFloat(price));
    };

    if (authLoading || (!user && !authLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const initials = profile
        ? `${(profile.firstName || "")[0] || ""}${(profile.lastName || "")[0] || ""}`.toUpperCase() || user?.email?.[0]?.toUpperCase()
        : user?.email?.[0]?.toUpperCase();

    return (
        <div className="bg-gray-50 dark:bg-[#0a0a0a] min-h-screen">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-[#2c2c2c] via-[#3a3a3a] to-[#2c2c2c] text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-300 rounded-full blur-[150px]" />
                </div>
                <div className="container mx-auto px-4 max-w-5xl py-10 md:py-14 relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild className="rounded-full text-white/70 hover:text-white hover:bg-white/10">
                            <Link href="/">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "Georgia, serif" }}>My Account</h1>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20 border-2 border-white/20">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {profile?.firstName || profile?.lastName
                                    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
                                    : "Welcome!"}
                            </h2>
                            <p className="text-white/60 text-sm mt-0.5">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-[#111] border-b dark:border-white/10 sticky top-[108px] z-40">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex gap-0">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === "profile"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Profile
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("orders")}
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === "orders"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Order History
                                {orders.length > 0 && (
                                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                                        {orders.length}
                                    </span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("wishlist")}
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === "wishlist"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                Wishlist
                                {wishlistProducts.length > 0 && (
                                    <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                                        {wishlistProducts.length}
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 max-w-5xl py-8">
                {/* ===================== PROFILE TAB ===================== */}
                {activeTab === "profile" && (
                    <div className="max-w-2xl">
                        {profileLoading ? (
                            <div className="space-y-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                                        <div className="h-12 bg-gray-200 rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-6 md:p-8 space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <User className="w-5 h-5 text-primary" />
                                        Personal Information
                                    </h3>

                                    {/* Email (read-only) */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
                                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300">
                                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="text-sm">{user?.email}</span>
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">First Name</label>
                                            <input
                                                id="firstName"
                                                name="firstName"
                                                type="text"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder="Enter first name"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-transparent dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Last Name</label>
                                            <input
                                                id="lastName"
                                                name="lastName"
                                                type="text"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder="Enter last name"
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-transparent dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+91 98765 43210"
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-transparent dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Shipping Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                            <textarea
                                                id="address"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                placeholder="Enter your full shipping address"
                                                rows={3}
                                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none bg-transparent dark:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Save Button */}
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-gray-900 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary dark:hover:text-amber-900 hover:bg-primary text-white px-8 py-6 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                                    >
                                        {saving ? (
                                            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
                                        ) : saveSuccess ? (
                                            <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Saved!</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>
                                        )}
                                    </Button>

                                    {profileError && (
                                        <p className="text-sm text-red-500 font-medium">{profileError}</p>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* ===================== ORDERS TAB ===================== */}
                {activeTab === "orders" && (
                    <div ref={ordersRef}>
                        {ordersLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 p-6 animate-pulse">
                                        <div className="flex justify-between mb-4">
                                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
                                            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded-full" />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                                                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : orders.length === 0 ? (
                            /* Empty State */
                            <div className="text-center py-16 px-4">
                                <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                                    <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                                    When you place an order, it will appear here. Start exploring our exquisite collection!
                                </p>
                                <Button asChild className="bg-gray-900 dark:bg-primary dark:text-amber-900 hover:bg-primary text-white px-8 py-6 rounded-full text-sm font-semibold shadow-lg">
                                    <Link href="/#products">Start Shopping</Link>
                                </Button>
                            </div>
                        ) : (
                            /* Orders List */
                            <div className="space-y-4">
                                {orders.map((order) => {
                                    const config = STATUS_CONFIG[order.status];
                                    const StatusIcon = config.icon;
                                    const isExpanded = expandedOrder === order.id;

                                    return (
                                        <div
                                            key={order.id}
                                            className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden transition-all hover:shadow-md"
                                        >
                                            {/* Order Header */}
                                            <button
                                                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                                                className="w-full text-left p-5 md:p-6"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                                            <Package className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                Order {getOrderReference({ orderNumber: order.orderNumber, orderId: order.id, createdAt: order.createdAt })}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {formatDate(order.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.color} dark:bg-opacity-20`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {config.label}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                            {formatPrice(order.total)}
                                                        </span>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Item previews (collapsed) */}
                                                {!isExpanded && (
                                                    <div className="flex items-center gap-2 ml-[52px]">
                                                        <div className="flex -space-x-2">
                                                            {order.items.slice(0, 4).map((item) => (
                                                                <div
                                                                    key={item.id}
                                                                    className="w-9 h-9 rounded-lg border-2 border-white dark:border-[#1a1a1a] overflow-hidden relative shadow-sm"
                                                                >
                                                                    {item.product.images?.[0] ? (
                                                                        <Image
                                                                            src={item.product.images[0]}
                                                                            alt={item.product.name}
                                                                            fill
                                                                            className="object-cover"
                                                                            sizes="36px"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                                            <Package className="w-3 h-3 text-gray-300" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-gray-400">
                                                            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                                                        </span>
                                                    </div>
                                                )}
                                            </button>

                                            {/* Expanded Items */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 dark:border-white/10 px-5 md:px-6 py-4 bg-gray-50/50 dark:bg-[#111]">
                                                    <div className="space-y-3">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-[#1a1a1a] p-3 rounded-xl border border-gray-100 dark:border-white/10">
                                                                <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 shadow-sm">
                                                                    {item.product.images?.[0] ? (
                                                                        <Image
                                                                            src={item.product.images[0]}
                                                                            alt={item.product.name}
                                                                            fill
                                                                            className="object-cover"
                                                                            sizes="56px"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gray-100 dark:bg-[#222] flex items-center justify-center">
                                                                            <Package className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <Link
                                                                        href={`/product/${item.product.slug}`}
                                                                        className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-1"
                                                                    >
                                                                        {item.product.name}
                                                                    </Link>
                                                                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                                                                </div>
                                                                <p className="text-sm font-bold text-primary shrink-0">
                                                                    {formatPrice(item.price)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Order Total in expanded view */}
                                                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">Order Total</span>
                                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ===================== WISHLIST TAB ===================== */}
                {activeTab === "wishlist" && (
                    <div className="max-w-4xl">
                        {wishlistProducts.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <div className="w-24 h-24 mx-auto bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
                                    <Heart className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                                    Save your favorite jewelry pieces here to easily find them later.
                                </p>
                                <Button asChild className="bg-gray-900 dark:bg-primary dark:text-amber-900 hover:bg-primary text-white px-8 py-6 rounded-full text-sm font-semibold shadow-lg">
                                    <Link href="/#products">Explore Collection</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wishlistProducts.map((product) => {
                                    return (
                                        <div key={product.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden group">
                                            <div className="relative aspect-square">
                                                <Image
                                                    src={product.image || '/products/golden-pearl-necklace.png'}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <button
                                                    onClick={() => removeFromWishlist(product.id)}
                                                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="p-4">
                                                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">{product.category}</div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 mb-2">{product.name}</h3>
                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">{formatPrice(product.price.toString())}</span>
                                                    <Button
                                                        onClick={() => addToCart(product.id)}
                                                        size="sm"
                                                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 text-xs rounded-lg"
                                                    >
                                                        Add to Cart
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

















