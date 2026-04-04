"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    User, Mail, Phone, MapPin, Package, ArrowLeft, Loader2, Save,
    CheckCircle2, Clock, Truck, XCircle, ShoppingBag, ChevronDown, ChevronUp, Heart,
    FileText, Download
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Image from "next/image";
import Link from "next/link";
import { useAppContext, Product } from "@/context/AppContext";
import { getOrderReference } from "@/lib/order-reference";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getProductCategoryLabel } from "@/lib/productCategory";

interface UserProfile {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    address: string | null;
    storeCredit?: number;
    creditLog?: {
        id: string;
        amount: string;
        reason: string;
        createdAt: string;
    }[];
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
    status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "PAID";
    total: string;
    mrpTotal?: string | null;
    discountOnMRP?: string | null;
    shippingAmount?: string | null;
    couponDiscount?: string | null;
    storeCreditUsed?: string | null;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
    guestAddress?: string | null;
    guestFirstName?: string | null;
    guestLastName?: string | null;
    createdAt: string;
    items: OrderItem[];
}

const STATUS_CONFIG = {
    PENDING: { label: "Pending", icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" },
    CONFIRMED: { label: "Confirmed", icon: CheckCircle2, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    PROCESSING: { label: "Processing", icon: Loader2, color: "bg-blue-100 text-blue-700 border-blue-200" },
    SHIPPED: { label: "Shipped", icon: Truck, color: "bg-purple-100 text-purple-700 border-purple-200" },
    DELIVERED: { label: "Delivered", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
    CANCELLED: { label: "Cancelled", icon: XCircle, color: "bg-red-100 text-red-700 border-red-200" },
    PAID: { label: "Paid", icon: CheckCircle2, color: "bg-green-100 text-green-700 border-green-200" },
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
    const [activeTab, setActiveTab] = useState<"profile" | "orders" | "wishlist" | "wallet">("profile");
    const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
    const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

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
        } else if (window.location.hash === "#wallet") {
            setActiveTab("wallet");
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

    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (wishlist.length === 0) {
                setWishlistProducts([]);
                return;
            }

            try {
                const params = new URLSearchParams();
                params.set("ids", wishlist.join(","));
                const res = await fetch(`/api/products/by-ids?${params.toString()}`);
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
        } catch {
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

    const handleDownloadInvoice = async (order: Order) => {
        if (downloadingInvoice) return;
        setDownloadingInvoice(order.id);

        try {
            // Give the DOM a moment to render the template if it was conditional
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const element = document.getElementById(`invoice-template-${order.id}`);
            if (!element) throw new Error("Invoice template not found");

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const imgProps = (pdf as any).getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice-${getOrderReference({ orderNumber: order.orderNumber, orderId: order.id })}.pdf`);
        } catch (error) {
            console.error("Failed to generate invoice:", error);
        } finally {
            setDownloadingInvoice(null);
        }
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
                    <Breadcrumbs
                        items={[
                            { label: "Home", href: "/" },
                            { label: "My Account" },
                        ]}
                        currentPath="/profile"
                        className="mb-6 text-white/70"
                    />

                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="ghost" size="icon" asChild className="rounded-full text-white/70 hover:text-white hover:bg-white/10">
                            <Link href="/">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold">My Account</h1>
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
            <div className="bg-white dark:bg-[#111] border-b dark:border-white/10 sticky top-[64px] md:top-[108px] z-40">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="flex gap-0 overflow-x-auto hide-scrollbar whitespace-nowrap">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${activeTab === "profile"
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
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${activeTab === "orders"
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
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${activeTab === "wishlist"
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
                        <button
                            onClick={() => setActiveTab("wallet")}
                            className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${activeTab === "wallet"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" /> {/* Or use Wallet icon if imported */}
                                Wallet
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

                                            {/* Expanded Items (Professional Order Dashboard) */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 dark:border-white/10 px-5 md:px-8 py-8 bg-gray-50/50 dark:bg-[#0f0f0f] animate-in fade-in slide-in-from-top-4 duration-300">
                                                    
                                                    {/* 1. Status Stepper */}
                                                    <div className="mb-10">
                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                            Order Status
                                                        </h4>
                                                        <div className="relative px-2">
                                                            {/* Line Background */}
                                                            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 dark:bg-white/5" />
                                                            
                                                            <div className="relative flex justify-between">
                                                                {[
                                                                    { key: "PENDING", label: "Ordered" },
                                                                    { key: "CONFIRMED", label: "Confirmed" },
                                                                    { key: "SHIPPED", label: "Shipped" },
                                                                    { key: "DELIVERED", label: "Delivered" }
                                                                ].map((step, idx) => {
                                                                    const steps = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
                                                                    const currentIdx = steps.indexOf(order.status === "PAID" ? "CONFIRMED" : order.status);
                                                                    const stepIdx = steps.indexOf(step.key);
                                                                    const isCompleted = currentIdx >= stepIdx;
                                                                    const isCurrent = order.status === step.key || (order.status === "PAID" && step.key === "CONFIRMED");

                                                                    return (
                                                                        <div key={step.key} className="flex flex-col items-center group relative z-10">
                                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-2 ${
                                                                                isCompleted 
                                                                                    ? "bg-primary border-primary text-background shadow-lg shadow-primary/20" 
                                                                                    : "bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-400"
                                                                            }`}>
                                                                                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                                                                            </div>
                                                                            <p className={`mt-3 text-xs font-bold transition-colors ${
                                                                                isCompleted ? "text-primary" : "text-gray-400"
                                                                            }`}>
                                                                                {step.label}
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                                        {/* 2. Items List (left) */}
                                                        <div className="lg:col-span-7 space-y-4">
                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 uppercase tracking-tight">
                                                                <ShoppingBag className="w-4 h-4 text-primary" />
                                                                Items Ordered
                                                            </h4>
                                                            {order.items.map((item) => (
                                                                <div key={item.id} className="flex items-center gap-5 bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm group hover:border-primary/20 transition-all">
                                                                    <div className="w-20 h-20 rounded-xl overflow-hidden relative shrink-0 shadow-sm border border-gray-100 dark:border-white/10">
                                                                        {item.product.images?.[0] ? (
                                                                            <Image
                                                                                src={item.product.images[0]}
                                                                                alt={item.product.name}
                                                                                fill
                                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                                                sizes="80px"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-gray-100 dark:bg-[#222] flex items-center justify-center">
                                                                                <Package className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <Link
                                                                            href={`/product/${item.product.slug}`}
                                                                            className="text-base font-bold text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-1 truncate"
                                                                        >
                                                                            {item.product.name}
                                                                        </Link>
                                                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded uppercase lg:tracking-wider">Qty: {item.quantity}</span>
                                                                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded uppercase lg:tracking-wider">Unit: {formatPrice(item.price)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-base font-bold text-primary shrink-0">
                                                                        {formatPrice((parseFloat(item.price) * item.quantity).toString())}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* 3. Info and Summary (right) */}
                                                        <div className="lg:col-span-5 space-y-6">
                                                            {/* Shipping and Payment Info */}
                                                            <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                                                                <div>
                                                                    <h5 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-3">Shipping Address</h5>
                                                                    <div className="flex gap-3">
                                                                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                                        <div className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                                                                            <p className="text-gray-900 dark:text-white font-bold text-base mb-1">
                                                                                {order.guestFirstName || profile?.firstName} {order.guestLastName || profile?.lastName}
                                                                            </p>
                                                                            {order.guestAddress || profile?.address || "Address details not available"}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                                                    <h5 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-3">Payment Information</h5>
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-gray-400 mb-1">Method</p>
                                                                            <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{order.paymentMethod || "Online"}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] font-bold text-gray-400 mb-1">Status</p>
                                                                            <p className={`text-sm font-bold uppercase ${order.paymentStatus === "PAID" ? 'text-primary' : 'text-amber-500'}`}>
                                                                                {order.paymentStatus || "Verified"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Order Summary Block */}
                                                            <div className="bg-gray-900 dark:bg-primary/5 p-6 rounded-2xl border border-gray-800 dark:border-primary/10 shadow-lg">
                                                                <h4 className="text-sm font-bold text-white dark:text-primary mb-5 uppercase tracking-tighter">Bill Summary</h4>
                                                                <div className="space-y-3.5 text-sm">
                                                                    <div className="flex justify-between text-gray-400 font-medium">
                                                                        <span>Total MRP</span>
                                                                        <span className="text-gray-300">{formatPrice(order.mrpTotal || order.total)}</span>
                                                                    </div>
                                                                    {order.discountOnMRP && parseFloat(order.discountOnMRP) > 0 && (
                                                                        <div className="flex justify-between text-emerald-400 font-bold">
                                                                            <span>MRP Discount</span>
                                                                            <span className="flex items-center gap-1.5">- {formatPrice(order.discountOnMRP)}</span>
                                                                        </div>
                                                                    )}
                                                                    {order.couponDiscount && parseFloat(order.couponDiscount) > 0 && (
                                                                        <div className="flex justify-between text-emerald-400 font-bold">
                                                                            <span>Coupon Discount</span>
                                                                            <span className="flex items-center gap-1.5">- {formatPrice(order.couponDiscount)}</span>
                                                                        </div>
                                                                    )}
                                                                    {order.storeCreditUsed && parseFloat(order.storeCreditUsed) > 0 && (
                                                                        <div className="flex justify-between text-emerald-400 font-bold">
                                                                            <span>Store Credit</span>
                                                                            <span className="flex items-center gap-1.5">- {formatPrice(order.storeCreditUsed)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className="flex justify-between text-gray-400 font-medium pb-4 border-b border-white/10">
                                                                        <span>Shipping & Handling</span>
                                                                        <span className="text-gray-300">{order.shippingAmount && parseFloat(order.shippingAmount) > 0 ? formatPrice(order.shippingAmount) : 'FREE'}</span>
                                                                    </div>
                                                                    <div className="flex justify-between text-lg font-bold text-white pt-2">
                                                                        <span>Final Amount</span>
                                                                        <span className="text-primary">{formatPrice(order.total)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Support Section */}
                                                            <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center space-y-4">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">Need help with this order?</p>
                                                                <Link 
                                                                    href="mailto:support@swarnacollection.in" 
                                                                    className="text-xs font-bold text-primary hover:underline underline-offset-4 block mb-4"
                                                                >
                                                                    Contact Customer Support
                                                                </Link>
                                                                
                                                                <Button 
                                                                    onClick={() => handleDownloadInvoice(order)}
                                                                    disabled={downloadingInvoice === order.id}
                                                                    variant="outline"
                                                                    className="w-full py-6 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary font-bold text-xs rounded-xl transition-all"
                                                                >
                                                                    {downloadingInvoice === order.id ? (
                                                                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Preparing PDF...</span>
                                                                    ) : (
                                                                        <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Download Invoice</span>
                                                                    )}
                                                                </Button>
                                                            </div>

                                                            {/* Hidden Invoice Template (Rendered only when expanded for DOM accessibility) */}
                                                            <div className="hidden">
                                                                <div 
                                                                    id={`invoice-template-${order.id}`}
                                                                    className="bg-white p-12 text-black font-sans"
                                                                    style={{ width: "210mm", minHeight: "297mm" }}
                                                                >
                                                                    <div className="flex justify-between items-start border-b-4 border-primary pb-8 mb-8">
                                                                        <div>
                                                                            <h1 className="text-4xl font-bold tracking-[0.2em] mb-2">SWARNA</h1>
                                                                            <p className="text-gray-500 font-medium">COLLECTION</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-400">Tax Invoice</h2>
                                                                            <p className="text-sm font-bold mt-1"># {getOrderReference({ orderNumber: order.orderNumber, orderId: order.id })}</p>
                                                                            <p className="text-xs text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-12 mb-12">
                                                                        <div>
                                                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Sold By</p>
                                                                            <p className="font-bold text-sm">Swarna Collection</p>
                                                                            <p className="text-xs text-gray-600 leading-relaxed mt-1">
                                                                                Luxury Jewelry Boutique<br />
                                                                                info@swarnacollection.in<br />
                                                                                www.swarnacollection.in
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Billing To</p>
                                                                            <p className="font-bold text-sm">{order.guestFirstName || profile?.firstName} {order.guestLastName || profile?.lastName}</p>
                                                                            <p className="text-xs text-gray-600 leading-relaxed mt-1">
                                                                                {order.guestAddress || profile?.address || "Address details not available"}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <table className="w-full mb-12">
                                                                        <thead className="bg-gray-50">
                                                                            <tr>
                                                                                <th className="text-left text-[10px] uppercase font-bold py-3 px-4">Item Description</th>
                                                                                <th className="text-center text-[10px] uppercase font-bold py-3 px-4">Qty</th>
                                                                                <th className="text-right text-[10px] uppercase font-bold py-3 px-4">Unit Price</th>
                                                                                <th className="text-right text-[10px] uppercase font-bold py-3 px-4">Total</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-100">
                                                                            {order.items.map((item) => (
                                                                                <tr key={item.id}>
                                                                                    <td className="py-4 px-4">
                                                                                        <p className="text-sm font-bold">{item.product.name}</p>
                                                                                        <p className="text-[10px] text-gray-400 mt-0.5">ID: {item.product.id.substring(0,8)}</p>
                                                                                    </td>
                                                                                    <td className="text-center text-sm py-4 px-4">{item.quantity}</td>
                                                                                    <td className="text-right text-sm py-4 px-4">{formatPrice(item.price)}</td>
                                                                                    <td className="text-right text-sm font-bold py-4 px-4">{formatPrice((parseFloat(item.price) * item.quantity).toString())}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>

                                                                    <div className="flex justify-end">
                                                                        <div className="w-64 space-y-3">
                                                                            <div className="flex justify-between text-xs text-gray-500">
                                                                                <span>Subtotal</span>
                                                                                <span className="font-bold text-black">{formatPrice(order.mrpTotal || order.total)}</span>
                                                                            </div>
                                                                            {order.discountOnMRP && parseFloat(order.discountOnMRP) > 0 && (
                                                                                <div className="flex justify-between text-xs text-emerald-600">
                                                                                    <span>MRP Discount</span>
                                                                                    <span className="font-bold">- {formatPrice(order.discountOnMRP)}</span>
                                                                                </div>
                                                                            )}
                                                                            {order.couponDiscount && parseFloat(order.couponDiscount) > 0 && (
                                                                                <div className="flex justify-between text-xs text-emerald-600">
                                                                                    <span>Coupon Savings</span>
                                                                                    <span className="font-bold">- {formatPrice(order.couponDiscount)}</span>
                                                                                </div>
                                                                            )}
                                                                            {order.storeCreditUsed && parseFloat(order.storeCreditUsed) > 0 && (
                                                                                <div className="flex justify-between text-xs text-emerald-600">
                                                                                    <span>Store Credit Applied</span>
                                                                                    <span className="font-bold">- {formatPrice(order.storeCreditUsed)}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex justify-between text-xs text-gray-500">
                                                                                <span>Shipping Fee</span>
                                                                                <span className="font-bold text-black">
                                                                                    {order.shippingAmount && parseFloat(order.shippingAmount) > 0 ? formatPrice(order.shippingAmount) : "FREE"}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between text-lg font-bold pt-4 border-t-2 border-primary text-primary">
                                                                                <span>TOTAL</span>
                                                                                <span>{formatPrice(order.total)}</span>
                                                                            </div>
                                                                            <div className="pt-8 text-center">
                                                                                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Thank you for your purchase!</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
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
                                                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1.5">{getProductCategoryLabel(product.category)}</div>
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

                {/* ===================== WALLET TAB ===================== */}
                {activeTab === "wallet" && (
                    <div className="max-w-3xl">
                        {profileLoading ? (
                             <div className="animate-pulse h-64 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl"></div>
                        ) : (
                            <div className="space-y-6">
                                {/* Current Balance Card */}
                                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2c2c2c] rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                                     <h3 className="text-white/80 font-medium mb-2 relative z-10">Available Store Credit</h3>
                                     <div className="text-4xl md:text-5xl font-bold text-primary relative z-10">
                                         {formatPrice(profile?.storeCredit?.toString() || "0")}
                                     </div>
                                     <p className="text-white/60 text-sm mt-4 relative z-10 max-w-sm">
                                         Store credit can be applied automatically during checkout. It never expires and can be used on any product.
                                     </p>
                                </div>

                                {/* Ledger History */}
                                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 dark:border-white/10">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h3>
                                    </div>
                                    
                                    {!profile?.creditLog || profile.creditLog.length === 0 ? (
                                        <div className="py-12 text-center text-gray-500">
                                            <p>No transactions found.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-white/10">
                                            {profile.creditLog.map((log) => {
                                                const amount = parseFloat(log.amount);
                                                const isPositive = amount > 0;
                                                return (
                                                    <div key={log.id} className="p-5 md:p-6 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white mb-1">{log.reason}</p>
                                                            <p className="text-xs text-gray-500">{formatDate(log.createdAt)}</p>
                                                        </div>
                                                        <div className={`font-bold ${isPositive ? 'text-success' : 'text-gray-900 dark:text-white'}`}>
                                                            {isPositive ? '+' : ''}{formatPrice(log.amount)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

















