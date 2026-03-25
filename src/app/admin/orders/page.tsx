"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Plus, RefreshCw, Search, ShoppingBag, UserPlus, X } from "lucide-react";
import { getOrderReference } from "@/lib/order-reference";

interface ProductOption {
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    image: string;
}

interface CustomerOption {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    address?: string | null;
}

interface Order {
    id: string;
    orderNumber?: string | null;
    status: string;
    paymentMethod?: string;
    paymentStatus?: string;
    total: number;
    paidAmount?: number;
    createdAt: string;
    guestEmail?: string | null;
    guestFirstName?: string | null;
    guestLastName?: string | null;
    user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
    items: { quantity: number; price: number; product: { name: string; images: string[]; stock?: number } }[];
    refundedAmount?: number;
    storeCreditUsed?: number;
}

interface CartItem {
    productId: string;
    name: string;
    image: string;
    stock: number;
    quantity: number;
    basePrice: number;
    overridePrice: string;
}

const ALL_STATUSES = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "PAID"];
const ORDER_STATUS_OPTIONS = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_METHOD_OPTIONS = ["CASH", "BANK_TRANSFER", "UPI", "COD", "CUSTOM"];
const PAYMENT_STATUS_OPTIONS = ["PENDING", "PARTIAL", "PAID"];

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    CONFIRMED: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    PROCESSING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    SHIPPED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    DELIVERED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
    PAID: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const formatInr = (value: number) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
}).format(value);

const emptyCustomer = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    // Refund Modal State
    const [refundMethod, setRefundMethod] = useState<'ORIGINAL' | 'STORE_CREDIT_ONLY'>('ORIGINAL');
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('');
    const [refundingOrder, setRefundingOrder] = useState<Order | null>(null);
    const [isRefunding, setIsRefunding] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customerMode, setCustomerMode] = useState<"existing" | "new">("existing");
    const [customerQuery, setCustomerQuery] = useState("");
    const [customerResults, setCustomerResults] = useState<CustomerOption[]>([]);
    const [searchingCustomers, setSearchingCustomers] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
    const [customerForm, setCustomerForm] = useState(emptyCustomer);
    const [productQuery, setProductQuery] = useState("");
    const [productResults, setProductResults] = useState<ProductOption[]>([]);
    const [searchingProducts, setSearchingProducts] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [createError, setCreateError] = useState("");
    const [createWarnings, setCreateWarnings] = useState<string[]>([]);
    const [createSuccess, setCreateSuccess] = useState("");
    const [manualOrder, setManualOrder] = useState({
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        paidAmount: "",
        orderStatus: "CONFIRMED",
        shippingCost: "",
        discount: "",
        notes: "",
        allowOutOfStock: false,
        updateStock: true,
    });

    const fetchOrders = async () => {
        setLoading(true);
        const res = await fetch("/api/admin/orders");
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        const id = requestAnimationFrame(() => {
            void fetchOrders();
        });
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        if (!createOpen) return;
        const timeoutId = window.setTimeout(async () => {
            setSearchingCustomers(true);
            try {
                const params = new URLSearchParams();
                if (customerQuery.trim()) params.set("q", customerQuery.trim());
                const res = await fetch(`/api/admin/customers?${params.toString()}`, { cache: "no-store" });
                const data = await res.json();
                setCustomerResults(Array.isArray(data) ? data : []);
            } finally {
                setSearchingCustomers(false);
            }
        }, customerQuery.trim() ? 250 : 0);

        return () => window.clearTimeout(timeoutId);
    }, [customerQuery, createOpen]);

    useEffect(() => {
        if (!createOpen || !productQuery.trim()) {
            setProductResults([]);
            return;
        }

        const timeoutId = window.setTimeout(async () => {
            setSearchingProducts(true);
            try {
                const params = new URLSearchParams({ search: productQuery.trim() });
                const res = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });
                const data = await res.json();
                setProductResults(Array.isArray(data) ? data : []);
            } finally {
                setSearchingProducts(false);
            }
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [productQuery, createOpen]);

    const resetCreateOrder = () => {
        setCreateOpen(false);
        setIsSubmitting(false);
        setCustomerMode("existing");
        setCustomerQuery("");
        setCustomerResults([]);
        setSelectedCustomer(null);
        setCustomerForm(emptyCustomer);
        setProductQuery("");
        setProductResults([]);
        setCartItems([]);
        setCreateError("");
        setCreateWarnings([]);
        setManualOrder({
            paymentMethod: "COD",
            paymentStatus: "PENDING",
            paidAmount: "",
            orderStatus: "CONFIRMED",
            shippingCost: "",
            discount: "",
            notes: "",
            allowOutOfStock: false,
            updateStock: true,
        });
    };

    const selectCustomer = (customer: CustomerOption) => {
        setSelectedCustomer(customer);
        setCustomerForm({
            firstName: customer.firstName || "",
            lastName: customer.lastName || "",
            email: customer.email || "",
            phone: customer.phone || "",
            address: customer.address || "",
        });
        setCustomerQuery(customer.email || "");
        setCustomerResults([]);
    };

    const addProduct = (product: ProductOption) => {
        setCartItems((prev) => {
            const existing = prev.find((item) => item.productId === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            return [
                ...prev,
                {
                    productId: product.id,
                    name: product.name,
                    image: product.image,
                    stock: product.stock,
                    quantity: 1,
                    basePrice: product.price,
                    overridePrice: "",
                },
            ];
        });
        setProductQuery("");
        setProductResults([]);
    };

    const updateCartItem = (productId: string, patch: Partial<CartItem>) => {
        setCartItems((prev) => prev.map((item) => item.productId === productId ? { ...item, ...patch } : item));
    };

    const removeCartItem = (productId: string) => {
        setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    };

    const updateStatus = async (orderId: string, status: string) => {
        setUpdatingId(orderId);
        await fetch(`/api/admin/orders/${orderId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        setUpdatingId(null);
    };

    const filtered = orders.filter(o => {
        const customerEmail = o.user?.email || o.guestEmail || "";
        const customerName = `${o.user?.firstName || o.guestFirstName || ""} ${o.user?.lastName || o.guestLastName || ""}`.trim();
        const matchesFilter = filter === "ALL" || o.status === filter;
        const matchesSearch = !search ||
            o.id.toLowerCase().includes(search.toLowerCase()) ||
            o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
            customerEmail.toLowerCase().includes(search.toLowerCase()) ||
            customerName.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const lineSubtotal = cartItems.reduce((sum, item) => {
        const price = item.overridePrice !== "" ? Number(item.overridePrice) : item.basePrice;
        return sum + Math.max(0, price) * item.quantity;
    }, 0);
    const shippingCost = Number(manualOrder.shippingCost || 0);
    const discount = Number(manualOrder.discount || 0);
    const finalTotal = Math.max(0, lineSubtotal + shippingCost - discount);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setCreateError("");
        setCreateWarnings([]);
        setCreateSuccess("");

        try {
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    existingCustomerId: customerMode === "existing" ? selectedCustomer?.id || null : null,
                    customer: customerForm,
                    items: cartItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        overridePrice: item.overridePrice === "" ? null : Number(item.overridePrice),
                    })),
                    paymentMethod: manualOrder.paymentMethod,
                    paymentStatus: manualOrder.paymentStatus,
                    paidAmount: manualOrder.paidAmount === "" ? 0 : Number(manualOrder.paidAmount),
                    orderStatus: manualOrder.orderStatus,
                    shippingCost,
                    discount,
                    notes: manualOrder.notes,
                    allowOutOfStock: manualOrder.allowOutOfStock,
                    updateStock: manualOrder.updateStock,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setCreateError(data.error || "Failed to create order.");
                setCreateWarnings(Array.isArray(data.warnings) ? data.warnings : []);
                return;
            }

            setCreateWarnings(Array.isArray(data.warnings) ? data.warnings : []);
            setCreateSuccess(`Order ${data.order?.orderNumber || "created"} successfully created.`);
            await fetchOrders();
            window.setTimeout(() => resetCreateOrder(), 700);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRefundSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!refundingOrder) return;
        setIsRefunding(true);

        try {
            const res = await fetch(`/api/admin/orders/${refundingOrder.id}/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refundAmount: parseFloat(refundAmount),
                    reason: refundReason,
                    refundMethod: refundMethod
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to process refund');
            }

            alert("Refund processed successfully!");
            setRefundingOrder(null);
            fetchOrders();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : "Failed to process refund");
        } finally {
            setIsRefunding(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Orders</h1>
                    <p className="text-gray-400 text-sm mt-1">{orders.length} total orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-background transition-all hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4" />
                        Create Order
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {createSuccess && (
                <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    {createSuccess}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by order ID, name or email..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {ALL_STATUSES.map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${filter === s
                                ? "bg-primary text-background border-primary"
                                : "border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-4">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center text-gray-500">
                        <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No orders found</p>
                        <p className="text-sm mt-1">Try changing the filter or search term</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b border-white/5 text-left">
                                    <th className="px-6 py-4 font-medium">Order</th>
                                    <th className="px-6 py-4 font-medium">Customer</th>
                                    <th className="px-6 py-4 font-medium">Items</th>
                                    <th className="px-6 py-4 font-medium">Total</th>
                                    <th className="px-6 py-4 font-medium">Payment</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map(order => {
                                    const customerName = `${order.user?.firstName || order.guestFirstName || "Guest"} ${order.user?.lastName || order.guestLastName || ""}`.trim();
                                    const customerEmail = order.user?.email || order.guestEmail || "No email";

                                    return (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-mono text-xs font-bold text-white">
                                                    {getOrderReference({ orderNumber: order.orderNumber, orderId: order.id, createdAt: order.createdAt })}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <p className="text-white font-medium">{customerName}</p>
                                                <p className="text-gray-500 text-xs mt-0.5">{customerEmail}</p>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {order.items.slice(0, 2).map((item, i) => (
                                                        <p key={i} className="text-gray-300 text-xs line-clamp-1">
                                                            {item.quantity}x {item.product.name}
                                                        </p>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <p className="text-gray-500 text-xs">+{order.items.length - 2} more</p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-primary">{formatInr(Number(order.total))}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-medium text-white">{order.paymentMethod || "-"}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {order.paymentStatus || "PENDING"}
                                                    {typeof order.paidAmount === "number" && order.paidAmount > 0 ? ` • ${formatInr(order.paidAmount)}` : ""}
                                                </p>
                                            </td>

                                            <td className="px-6 py-4 text-gray-400 text-xs">
                                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric"
                                                })}
                                            </td>

                                            <td className="px-6 py-4 flex gap-2 items-center">
                                                <select
                                                    value={order.status}
                                                    disabled={updatingId === order.id}
                                                    onChange={e => updateStatus(order.id, e.target.value)}
                                                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all disabled:opacity-50 ${STATUS_COLORS[order.status] ?? ""} bg-transparent`}
                                                >
                                                    {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "PAID"].map(s => (
                                                        <option key={s} value={s} className="bg-[#1a1a1a] text-white">{s}</option>
                                                    ))}
                                                </select>

                                                {(order.status === 'PAID' || order.status === 'PROCESSING') && (order.total - Number(order.refundedAmount || 0)) > 0 && (
                                                    <button 
                                                        onClick={() => setRefundingOrder(order)}
                                                        className="text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-1.5 rounded border border-red-500/20 transition-all font-medium"
                                                    >
                                                        Refund
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {createOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
                    <div className="mx-auto w-full max-w-6xl rounded-[28px] border border-white/10 bg-[#121212] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-white">Create Manual Order</h2>
                                <p className="mt-1 text-sm text-gray-400">Build the order, set payment details, and optionally deduct stock now.</p>
                            </div>
                            <button onClick={resetCreateOrder} className="rounded-xl border border-white/10 p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOrder} className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.9fr]">
                            <div className="space-y-6">
                                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-white">Customer Info</h3>
                                            <p className="mt-1 text-xs text-gray-500">Reuse by email or phone, or create a fresh customer automatically.</p>
                                        </div>
                                        <div className="flex rounded-xl border border-white/10 p-1">
                                            {["existing", "new"].map((mode) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setCustomerMode(mode as "existing" | "new")}
                                                    className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${customerMode === mode ? "bg-primary text-background" : "text-gray-400 hover:text-white"}`}
                                                >
                                                    {mode === "existing" ? "Existing" : "New"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {customerMode === "existing" && (
                                        <div className="mb-4 space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    value={customerQuery}
                                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                                    placeholder="Search by email or phone"
                                                    className="w-full rounded-xl border border-white/10 bg-[#111] py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60"
                                                />
                                            </div>
                                            <div className="rounded-2xl border border-white/10 bg-[#0f0f0f]">
                                                {searchingCustomers ? (
                                                    <div className="p-4 text-sm text-gray-500">Searching customers...</div>
                                                ) : customerResults.length === 0 ? (
                                                    <div className="p-4 text-sm text-gray-500">No matching customer yet.</div>
                                                ) : (
                                                    customerResults.map((customer) => (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            onClick={() => selectCustomer(customer)}
                                                            className={`flex w-full items-start justify-between gap-3 border-b border-white/5 px-4 py-3 text-left last:border-b-0 ${selectedCustomer?.id === customer.id ? "bg-primary/10" : "hover:bg-white/5"}`}
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unnamed customer"}</p>
                                                                <p className="mt-1 text-xs text-gray-400">{customer.email}</p>
                                                                {customer.phone && <p className="mt-1 text-xs text-gray-500">{customer.phone}</p>}
                                                            </div>
                                                            {selectedCustomer?.id === customer.id && <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-background">Selected</span>}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <input value={customerForm.firstName} onChange={(e) => setCustomerForm((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="First name" className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                        <input value={customerForm.lastName} onChange={(e) => setCustomerForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Last name" className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                        <input value={customerForm.email} onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                        <input value={customerForm.phone} onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                    </div>
                                    <textarea value={customerForm.address} onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Address" rows={3} className="mt-4 w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                </section>

                                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-white">Product Selection</h3>
                                        <p className="mt-1 text-xs text-gray-500">Search products, set quantity, and override price if needed.</p>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            value={productQuery}
                                            onChange={(e) => setProductQuery(e.target.value)}
                                            placeholder="Search product"
                                            className="w-full rounded-xl border border-white/10 bg-[#111] py-3 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60"
                                        />
                                    </div>
                                    {productQuery.trim() && (
                                        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0f0f0f]">
                                            {searchingProducts ? (
                                                <div className="p-4 text-sm text-gray-500">Searching products...</div>
                                            ) : productResults.length === 0 ? (
                                                <div className="p-4 text-sm text-gray-500">No matching products found.</div>
                                            ) : (
                                                productResults.slice(0, 6).map((product) => (
                                                    <button key={product.id} type="button" onClick={() => addProduct(product)} className="flex w-full items-center justify-between gap-3 border-b border-white/5 px-4 py-3 text-left last:border-b-0 hover:bg-white/5">
                                                        <div>
                                                            <p className="text-sm font-medium text-white">{product.name}</p>
                                                            <p className="mt-1 text-xs text-gray-500">{product.category} • Stock {product.stock}</p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-primary">{formatInr(product.price)}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-3">
                                        {cartItems.length === 0 ? (
                                            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-500">Add products to start building the order.</div>
                                        ) : (
                                            cartItems.map((item) => {
                                                const price = item.overridePrice !== "" ? Number(item.overridePrice) : item.basePrice;
                                                const stockExceeded = item.quantity > item.stock;
                                                return (
                                                    <div key={item.productId} className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{item.name}</p>
                                                                <p className="mt-1 text-xs text-gray-500">Base {formatInr(item.basePrice)} • Stock {item.stock}</p>
                                                            </div>
                                                            <button type="button" onClick={() => removeCartItem(item.productId)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-gray-400 hover:text-white">Remove</button>
                                                        </div>
                                                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                            <input type="number" min={1} value={item.quantity} onChange={(e) => updateCartItem(item.productId, { quantity: Math.max(1, Number(e.target.value || 1)) })} className="rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60" />
                                                            <input type="number" min={0} step="0.01" value={item.overridePrice} onChange={(e) => updateCartItem(item.productId, { overridePrice: e.target.value })} placeholder={`${item.basePrice}`} className="rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/60" />
                                                            <div className="rounded-xl border border-white/10 bg-[#111] px-3 py-2.5 text-sm font-semibold text-primary">{formatInr(Math.max(0, price) * item.quantity)}</div>
                                                        </div>
                                                        {stockExceeded && (
                                                            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                                                                <AlertTriangle className="w-4 h-4" />
                                                                Quantity exceeds stock. Enable out-of-stock ordering to continue.
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                    <h3 className="text-sm font-semibold text-white">Order Details</h3>
                                    <div className="mt-4 space-y-4">
                                        <select value={manualOrder.paymentMethod} onChange={(e) => setManualOrder((prev) => ({ ...prev, paymentMethod: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-3 text-sm text-white focus:outline-none focus:border-primary/60">{PAYMENT_METHOD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                        <select value={manualOrder.paymentStatus} onChange={(e) => setManualOrder((prev) => ({ ...prev, paymentStatus: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-3 text-sm text-white focus:outline-none focus:border-primary/60">{PAYMENT_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                        <input type="number" min={0} step="0.01" value={manualOrder.paidAmount} onChange={(e) => setManualOrder((prev) => ({ ...prev, paidAmount: e.target.value }))} placeholder="Paid amount" className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                        <select value={manualOrder.orderStatus} onChange={(e) => setManualOrder((prev) => ({ ...prev, orderStatus: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-3 text-sm text-white focus:outline-none focus:border-primary/60">{ORDER_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="number" min={0} step="0.01" value={manualOrder.shippingCost} onChange={(e) => setManualOrder((prev) => ({ ...prev, shippingCost: e.target.value }))} placeholder="Shipping cost" className="rounded-xl border border-white/10 bg-[#111] px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                            <input type="number" min={0} step="0.01" value={manualOrder.discount} onChange={(e) => setManualOrder((prev) => ({ ...prev, discount: e.target.value }))} placeholder="Discount" className="rounded-xl border border-white/10 bg-[#111] px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                        </div>
                                        <textarea rows={4} value={manualOrder.notes} onChange={(e) => setManualOrder((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" className="w-full rounded-xl border border-white/10 bg-[#111] px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/60" />
                                        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white"><span>Allow out-of-stock order</span><input type="checkbox" checked={manualOrder.allowOutOfStock} onChange={(e) => setManualOrder((prev) => ({ ...prev, allowOutOfStock: e.target.checked }))} /></label>
                                        <label className="flex items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white"><span>Update stock now</span><input type="checkbox" checked={manualOrder.updateStock} onChange={(e) => setManualOrder((prev) => ({ ...prev, updateStock: e.target.checked }))} /></label>
                                    </div>
                                </section>

                                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                    <h3 className="text-sm font-semibold text-white">Summary</h3>
                                    <div className="mt-4 space-y-3 text-sm">
                                        <div className="flex items-center justify-between text-gray-400"><span>Items subtotal</span><span className="text-white">{formatInr(lineSubtotal)}</span></div>
                                        <div className="flex items-center justify-between text-gray-400"><span>Shipping</span><span className="text-white">{formatInr(shippingCost)}</span></div>
                                        <div className="flex items-center justify-between text-gray-400"><span>Discount</span><span className="text-white">-{formatInr(discount)}</span></div>
                                        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold"><span className="text-white">Total</span><span className="text-primary">{formatInr(finalTotal)}</span></div>
                                    </div>
                                    {createError && <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{createError}</div>}
                                    {createWarnings.length > 0 && (
                                        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 text-sm text-amber-300">
                                            <div className="flex items-center gap-2 font-medium"><AlertTriangle className="w-4 h-4" />Stock warnings</div>
                                            <div className="mt-2 space-y-1 text-xs">{createWarnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
                                        </div>
                                    )}
                                    <button type="submit" disabled={isSubmitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-medium text-background transition-colors hover:bg-primary/90 disabled:opacity-60">
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                        Create Order
                                    </button>
                                </section>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Refund Dialog Modal */}
            {refundingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md p-6 border border-white/10 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-4">Refund Order</h2>
                        <div className="text-sm text-gray-400 mb-6">
                            <p>Order Total: {formatInr(refundingOrder.total)}</p>
                            <p>Already Refunded: {formatInr(Number(refundingOrder.refundedAmount || 0))}</p>
                            <p>Max Refundable: <span className="text-primary font-bold">{formatInr(refundingOrder.total - Number(refundingOrder.refundedAmount || 0))}</span></p>
                        </div>
                        
                        <form onSubmit={handleRefundSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Refund Method</label>
                                <select 
                                    value={refundMethod}
                                    onChange={(e) => setRefundMethod(e.target.value as 'ORIGINAL' | 'STORE_CREDIT_ONLY')}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="ORIGINAL" className="bg-[#1a1a1a]">Split (Wallet First, then Razorpay)</option>
                                    <option value="STORE_CREDIT_ONLY" className="bg-[#1a1a1a]">100% Store Credit Only (Fast)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Refund Amount ({"\u20B9"})</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="0.01"
                                    max={refundingOrder.total - Number(refundingOrder.refundedAmount || 0)}
                                    value={refundAmount}
                                    onChange={e => setRefundAmount(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Reason for Refund</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Customer requested cancellation"
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setRefundingOrder(null)}
                                    className="flex-1 px-4 py-2 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRefunding}
                                    className="flex-1 px-4 py-2 bg-primary text-background font-medium rounded-xl hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
                                >
                                    {isRefunding ? 'Processing...' : 'Issue Refund'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {!loading && filtered.length > 0 && (
                <div className="mt-4 text-right text-sm text-gray-500">
                    Showing {filtered.length} of {orders.length} orders
                </div>
            )}
        </div>
    );
}

