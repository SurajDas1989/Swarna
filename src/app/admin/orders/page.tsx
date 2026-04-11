"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, Loader2, MapPin, Package, Phone, Plus, RefreshCw, Save, Search, ShoppingBag, User, UserPlus, X } from "lucide-react";
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
    // Delivery fields (order-level — may differ from user profile for gifts etc.)
    guestEmail?: string | null;
    guestFirstName?: string | null;
    guestLastName?: string | null;
    guestPhone?: string | null;
    guestAddress?: string | null;
    notes?: string | null;
    shippingAmount?: number | null;
    user?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
        address?: string | null;
    } | null;
    items: { quantity: number; price: number; product: { name: string; images: string[]; stock?: number } }[];
    refundedAmount?: number;
    storeCreditUsed?: number;
    shiprocketOrderId?: string | null;
    shiprocketShipmentId?: string | null;
    awbCode?: string | null;
    trackingUrl?: string | null;
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
    PENDING:    "bg-amber-50 text-amber-700 border-amber-200",
    CONFIRMED:  "bg-blue-50 text-blue-700 border-blue-200",
    PROCESSING: "bg-violet-50 text-violet-700 border-violet-200",
    SHIPPED:    "bg-sky-50 text-sky-700 border-sky-200",
    DELIVERED:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED:  "bg-red-50 text-red-600 border-red-200",
    PAID:       "bg-emerald-50 text-emerald-700 border-emerald-200",
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

    // Telecaller Order Detail Drawer
    const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);
    const [drawerSaving, setDrawerSaving] = useState(false);
    const [drawerSaved, setDrawerSaved] = useState(false);
    const [drawerConfirming, setDrawerConfirming] = useState(false);
    const [drawerDelivery, setDrawerDelivery] = useState({
        firstName: "", lastName: "", phone: "", address: "", notes: "", updateUserProfile: false,
    });
    const [pushingShiprocket, setPushingShiprocket] = useState(false);
    const [shiprocketError, setShiprocketError] = useState("");

    const handlePushShiprocket = async () => {
        if (!drawerOrder) return;
        setPushingShiprocket(true);
        setShiprocketError("");
        try {
            const res = await fetch("/api/shiprocket/push-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: drawerOrder.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to push to Shiprocket");
            
            const updated = { 
                shiprocketOrderId: data.shiprocketOrderId, 
                awbCode: data.awbCode, 
                trackingUrl: data.trackingUrl 
            };
            setOrders(prev => prev.map(o => o.id === drawerOrder.id ? { ...o, ...updated } : o));
            setDrawerOrder(prev => prev ? { ...prev, ...updated } : prev);
        } catch (err: any) {
            setShiprocketError(err.message);
        } finally {
            setPushingShiprocket(false);
        }
    };

    const openDrawer = (order: Order) => {
        setDrawerOrder(order);
        setDrawerSaved(false);
        setDrawerDelivery({
            firstName:  order.guestFirstName  || order.user?.firstName  || "",
            lastName:   order.guestLastName   || order.user?.lastName   || "",
            phone:      order.guestPhone      || order.user?.phone      || "",
            address:    order.guestAddress    || order.user?.address    || "",
            notes:      order.notes           || "",
            updateUserProfile: false,
        });
    };

    const handleSaveDelivery = async () => {
        if (!drawerOrder) return;
        setDrawerSaving(true);
        const res = await fetch(`/api/admin/orders/${drawerOrder.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deliveryUpdate: drawerDelivery }),
        });
        if (res.ok) {
            const updated = await res.json();
            setOrders(prev => prev.map(o => o.id === drawerOrder.id ? { ...o, ...updated } : o));
            setDrawerOrder(prev => prev ? { ...prev, ...updated } : prev);
            setDrawerSaved(true);
            window.setTimeout(() => setDrawerSaved(false), 3000);
        }
        setDrawerSaving(false);
    };

    const handleConfirmOrder = async () => {
        if (!drawerOrder) return;
        setDrawerConfirming(true);
        const res = await fetch(`/api/admin/orders/${drawerOrder.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CONFIRMED", deliveryUpdate: drawerDelivery }),
        });
        if (res.ok) {
            setOrders(prev => prev.map(o => o.id === drawerOrder.id ? { ...o, status: "CONFIRMED" } : o));
            setDrawerOrder(prev => prev ? { ...prev, status: "CONFIRMED" } : prev);
        }
        setDrawerConfirming(false);
    };

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

    const exportToCsv = () => {
        if (filtered.length === 0) return;

        const headers = [
            "Order Reference",
            "Date",
            "Customer Name",
            "Email",
            "Phone",
            "Address",
            "Items",
            "Total",
            "Payment Method",
            "Payment Status",
            "Order Status",
            "Notes"
        ];

        const rows = filtered.map(order => {
            const customerName = `${order.user?.firstName || order.guestFirstName || ""} ${order.user?.lastName || order.guestLastName || ""}`.trim();
            const email = order.user?.email || order.guestEmail || "";
            const phone = order.user?.phone || order.guestPhone || "";
            const address = `"${(order.user?.address || order.guestAddress || "").replace(/"/g, '""')}"`;
            
            const itemsString = `"${order.items.map(i => `${i.quantity}x ${i.product.name}`).join(", ").replace(/"/g, '""')}"`;
            const orderRef = getOrderReference({ orderNumber: order.orderNumber, orderId: order.id, createdAt: order.createdAt });
            const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
            });
            const notes = `"${(order.notes || "").replace(/"/g, '""')}"`;

            return [
                orderRef,
                date,
                `"${customerName}"`,
                email,
                phone,
                address,
                itemsString,
                order.total,
                order.paymentMethod || "",
                order.paymentStatus || "",
                order.status,
                notes
            ].join(",");
        });

        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `orders_export_${filter.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{orders.length} total orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCsv}
                        disabled={filtered.length === 0}
                        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-700 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Create Order
                    </button>
                    <button
                        onClick={fetchOrders}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg transition-all shadow-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {createSuccess && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
                    {createSuccess}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mb-5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by order ID, name or email..."
                        className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {ALL_STATUSES.map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                filter === s
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-white"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600">No orders found</p>
                        <p className="text-xs text-gray-400 mt-1">Try changing the filter or search term</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Order</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Items</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Payment</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(order => {
                                    const customerName = `${order.user?.firstName || order.guestFirstName || "Guest"} ${order.user?.lastName || order.guestLastName || ""}`.trim();
                                    const customerEmail = order.user?.email || order.guestEmail || "No email";

                                    return (
                                        <tr
                                            key={order.id}
                                            onClick={() => openDrawer(order)}
                                            className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-mono text-xs font-semibold text-gray-600">
                                                    {getOrderReference({ orderNumber: order.orderNumber, orderId: order.id, createdAt: order.createdAt })}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-gray-800 text-sm">{customerName}</p>
                                                <p className="text-gray-400 text-xs mt-0.5">{customerEmail}</p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="space-y-0.5">
                                                    {order.items.slice(0, 2).map((item, i) => (
                                                        <p key={i} className="text-gray-600 text-xs line-clamp-1">
                                                            {item.quantity}× {item.product.name}
                                                        </p>
                                                    ))}
                                                    {order.items.length > 2 && (
                                                        <p className="text-gray-400 text-xs">+{order.items.length - 2} more</p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-gray-800">{formatInr(Number(order.total))}</td>
                                            <td className="px-5 py-4">
                                                <p className="text-xs font-medium text-gray-700">{order.paymentMethod || "—"}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {order.paymentStatus || "PENDING"}
                                                    {typeof order.paidAmount === "number" && order.paidAmount > 0 ? ` · ${formatInr(order.paidAmount)}` : ""}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-gray-500 text-xs">
                                                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric"
                                                })}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={order.status}
                                                        disabled={updatingId === order.id}
                                                        onChange={e => updateStatus(order.id, e.target.value)}
                                                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none transition-all disabled:opacity-50 bg-transparent ${STATUS_COLORS[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
                                                    >
                                                        {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "PAID"].map(s => (
                                                            <option key={s} value={s} className="bg-white text-gray-800">{s}</option>
                                                        ))}
                                                    </select>

                                                    {(order.status === 'PAID' || order.status === 'PROCESSING') && (order.total - Number(order.refundedAmount || 0)) > 0 && (
                                                        <button
                                                            onClick={() => setRefundingOrder(order)}
                                                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1.5 rounded-lg border border-red-200 transition-all font-semibold"
                                                        >
                                                            Refund
                                                        </button>
                                                    )}
                                                </div>
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
                <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="mx-auto w-full max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Create Manual Order</h2>
                                <p className="mt-0.5 text-sm text-gray-500">Build the order, set payment details, and optionally deduct stock now.</p>
                            </div>
                            <button onClick={resetCreateOrder} className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOrder} className="grid gap-6 p-6 lg:grid-cols-[1.35fr_0.9fr]">
                            <div className="space-y-5">
                                <section className="rounded-xl border border-gray-200 p-5">
                                    <div className="mb-4 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-800">Customer Info</h3>
                                            <p className="mt-0.5 text-xs text-gray-400">Reuse by email or phone, or create a fresh customer automatically.</p>
                                        </div>
                                        <div className="flex rounded-lg border border-gray-200 p-0.5">
                                            {["existing", "new"].map((mode) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setCustomerMode(mode as "existing" | "new")}
                                                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${customerMode === mode ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-900"}`}
                                                >
                                                    {mode === "existing" ? "Existing" : "New"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {customerMode === "existing" && (
                                        <div className="mb-4 space-y-3">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    value={customerQuery}
                                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                                    placeholder="Search by email or phone"
                                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                                />
                                            </div>
                                            <div className="rounded-xl border border-gray-200 bg-gray-50">
                                                {searchingCustomers ? (
                                                    <div className="p-4 text-sm text-gray-400">Searching customers...</div>
                                                ) : customerResults.length === 0 ? (
                                                    <div className="p-4 text-sm text-gray-400">No matching customer yet.</div>
                                                ) : (
                                                    customerResults.map((customer) => (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            onClick={() => selectCustomer(customer)}
                                                            className={`flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 ${selectedCustomer?.id === customer.id ? "bg-indigo-50" : "hover:bg-gray-100"}`}
                                                        >
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-800">{[customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unnamed customer"}</p>
                                                                <p className="mt-0.5 text-xs text-gray-400">{customer.email}</p>
                                                                {customer.phone && <p className="mt-0.5 text-xs text-gray-400">{customer.phone}</p>}
                                                            </div>
                                                            {selectedCustomer?.id === customer.id && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">Selected</span>}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid gap-3 md:grid-cols-2">
                                        <input value={customerForm.firstName} onChange={(e) => setCustomerForm((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="First name" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                        <input value={customerForm.lastName} onChange={(e) => setCustomerForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Last name" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                        <input value={customerForm.email} onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                        <input value={customerForm.phone} onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                    </div>
                                    <textarea value={customerForm.address} onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Address" rows={3} className="mt-3 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                </section>

                                <section className="rounded-xl border border-gray-200 p-5">
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-gray-800">Product Selection</h3>
                                        <p className="mt-0.5 text-xs text-gray-400">Search products, set quantity, and override price if needed.</p>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            value={productQuery}
                                            onChange={(e) => setProductQuery(e.target.value)}
                                            placeholder="Search product"
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                        />
                                    </div>
                                    {productQuery.trim() && (
                                        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50">
                                            {searchingProducts ? (
                                                <div className="p-4 text-sm text-gray-400">Searching products...</div>
                                            ) : productResults.length === 0 ? (
                                                <div className="p-4 text-sm text-gray-400">No matching products found.</div>
                                            ) : (
                                                productResults.slice(0, 6).map((product) => (
                                                    <button key={product.id} type="button" onClick={() => addProduct(product)} className="flex w-full items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-100">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">{product.name}</p>
                                                            <p className="mt-0.5 text-xs text-gray-400">{product.category} · Stock {product.stock}</p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-indigo-600">{formatInr(product.price)}</p>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-3">
                                        {cartItems.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">Add products to start building the order.</div>
                                        ) : (
                                            cartItems.map((item) => {
                                                const price = item.overridePrice !== "" ? Number(item.overridePrice) : item.basePrice;
                                                const stockExceeded = item.quantity > item.stock;
                                                return (
                                                    <div key={item.productId} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                                                                <p className="mt-0.5 text-xs text-gray-400">Base {formatInr(item.basePrice)} · Stock {item.stock}</p>
                                                            </div>
                                                            <button type="button" onClick={() => removeCartItem(item.productId)} className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">Remove</button>
                                                        </div>
                                                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                            <input type="number" min={1} value={item.quantity} onChange={(e) => updateCartItem(item.productId, { quantity: Math.max(1, Number(e.target.value || 1)) })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                                            <input type="number" min={0} step="0.01" value={item.overridePrice} onChange={(e) => updateCartItem(item.productId, { overridePrice: e.target.value })} placeholder={`${item.basePrice}`} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                                            <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-600">{formatInr(Math.max(0, price) * item.quantity)}</div>
                                                        </div>
                                                        {stockExceeded && (
                                                            <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
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

                            <div className="space-y-5">
                                <section className="rounded-xl border border-gray-200 p-5">
                                    <h3 className="text-sm font-semibold text-gray-800">Order Details</h3>
                                    <div className="mt-4 space-y-3">
                                        <select value={manualOrder.paymentMethod} onChange={(e) => setManualOrder((prev) => ({ ...prev, paymentMethod: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">{PAYMENT_METHOD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                        <select value={manualOrder.paymentStatus} onChange={(e) => setManualOrder((prev) => ({ ...prev, paymentStatus: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">{PAYMENT_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                        <input type="number" min={0} step="0.01" value={manualOrder.paidAmount} onChange={(e) => setManualOrder((prev) => ({ ...prev, paidAmount: e.target.value }))} placeholder="Paid amount" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                        <select value={manualOrder.orderStatus} onChange={(e) => setManualOrder((prev) => ({ ...prev, orderStatus: e.target.value }))} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">{ORDER_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input type="number" min={0} step="0.01" value={manualOrder.shippingCost} onChange={(e) => setManualOrder((prev) => ({ ...prev, shippingCost: e.target.value }))} placeholder="Shipping" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                            <input type="number" min={0} step="0.01" value={manualOrder.discount} onChange={(e) => setManualOrder((prev) => ({ ...prev, discount: e.target.value }))} placeholder="Discount" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                        </div>
                                        <textarea rows={3} value={manualOrder.notes} onChange={(e) => setManualOrder((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                                        <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700"><span>Allow out-of-stock order</span><input type="checkbox" className="accent-indigo-600" checked={manualOrder.allowOutOfStock} onChange={(e) => setManualOrder((prev) => ({ ...prev, allowOutOfStock: e.target.checked }))} /></label>
                                        <label className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700"><span>Update stock now</span><input type="checkbox" className="accent-indigo-600" checked={manualOrder.updateStock} onChange={(e) => setManualOrder((prev) => ({ ...prev, updateStock: e.target.checked }))} /></label>
                                    </div>
                                </section>

                                <section className="rounded-xl border border-gray-200 p-5">
                                    <h3 className="text-sm font-semibold text-gray-800">Summary</h3>
                                    <div className="mt-4 space-y-2.5 text-sm">
                                        <div className="flex items-center justify-between text-gray-500"><span>Items subtotal</span><span className="font-semibold text-gray-800">{formatInr(lineSubtotal)}</span></div>
                                        <div className="flex items-center justify-between text-gray-500"><span>Shipping</span><span className="font-semibold text-gray-800">{formatInr(shippingCost)}</span></div>
                                        <div className="flex items-center justify-between text-gray-500"><span>Discount</span><span className="font-semibold text-gray-800">-{formatInr(discount)}</span></div>
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 font-bold"><span className="text-gray-800">Total</span><span className="text-indigo-600">{formatInr(finalTotal)}</span></div>
                                    </div>
                                    {createError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">{createError}</div>}
                                    {createWarnings.length > 0 && (
                                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                                            <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="w-4 h-4" />Stock warnings</div>
                                            <div className="mt-2 space-y-1 text-xs">{createWarnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
                                        </div>
                                    )}
                                    <button type="submit" disabled={isSubmitting} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-gray-200 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Refund Order</h2>
                        <div className="text-sm text-gray-500 mb-6 space-y-1">
                            <p>Order Total: <strong className="text-gray-700">{formatInr(refundingOrder.total)}</strong></p>
                            <p>Already Refunded: <strong className="text-gray-700">{formatInr(Number(refundingOrder.refundedAmount || 0))}</strong></p>
                            <p>Max Refundable: <strong className="text-indigo-600">{formatInr(refundingOrder.total - Number(refundingOrder.refundedAmount || 0))}</strong></p>
                        </div>
                        
                        <form onSubmit={handleRefundSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Refund Method</label>
                                <select 
                                    value={refundMethod}
                                    onChange={(e) => setRefundMethod(e.target.value as 'ORIGINAL' | 'STORE_CREDIT_ONLY')}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                >
                                    <option value="ORIGINAL">Split (Wallet First, then Razorpay)</option>
                                    <option value="STORE_CREDIT_ONLY">100% Store Credit Only (Fast)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Refund Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="0.01"
                                    max={refundingOrder.total - Number(refundingOrder.refundedAmount || 0)}
                                    value={refundAmount}
                                    onChange={e => setRefundAmount(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason for Refund</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Customer requested cancellation"
                                    value={refundReason}
                                    onChange={e => setRefundReason(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRefundingOrder(null)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRefunding}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                                >
                                    {isRefunding ? 'Processing...' : 'Issue Refund'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {!loading && filtered.length > 0 && (
                <div className="mt-4 px-1 text-xs text-gray-400 font-medium">
                    Showing {filtered.length} of {orders.length} orders
                </div>
            )}

            {/* ==== Telecaller Order Detail Drawer ==== */}
            {drawerOrder && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/30 backdrop-blur-sm"
                        onClick={() => setDrawerOrder(null)}
                    />
                    {/* Panel */}
                    <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                            <div>
                                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Order Detail</p>
                                <h2 className="text-base font-bold text-gray-900 mt-0.5">
                                    {getOrderReference({ orderNumber: drawerOrder.orderNumber, orderId: drawerOrder.id, createdAt: drawerOrder.createdAt })}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(drawerOrder.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </p>
                            </div>
                            <button onClick={() => setDrawerOrder(null)} className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                            {/* Confirm CTA — only shown for PENDING */}
                            {drawerOrder.status === "PENDING" && (
                                <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-100 rounded-lg">
                                            <Phone className="w-4 h-4 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-indigo-800">Action Required — Confirm before shipping</p>
                                            <p className="text-xs text-indigo-600 mt-0.5">Verify delivery details with the customer, update if needed, then confirm.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleConfirmOrder}
                                        disabled={drawerConfirming}
                                        className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                                    >
                                        {drawerConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        {drawerConfirming ? "Confirming..." : "✅ Confirm Order"}
                                    </button>
                                </div>
                            )}

                            {/* Status badge */}
                            {drawerOrder.status !== "PENDING" && (
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${STATUS_COLORS[drawerOrder.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                                        <ChevronDown className="w-3 h-3" />
                                        {drawerOrder.status}
                                    </span>
                                    <span className="text-xs text-gray-400">· {drawerOrder.paymentMethod} · {drawerOrder.paymentStatus}</span>
                                </div>
                            )}

                            {/* Delivery Details — Editable */}
                            <section className="rounded-xl border border-gray-200 p-4 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-indigo-500" />
                                    <h3 className="text-sm font-semibold text-gray-800">Delivery Details</h3>
                                    <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Editable</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">First Name</label>
                                        <input
                                            value={drawerDelivery.firstName}
                                            onChange={e => setDrawerDelivery(p => ({ ...p, firstName: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-gray-500 mb-1">Last Name</label>
                                        <input
                                            value={drawerDelivery.lastName}
                                            onChange={e => setDrawerDelivery(p => ({ ...p, lastName: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">📞 Phone Number</label>
                                    <input
                                        value={drawerDelivery.phone}
                                        onChange={e => setDrawerDelivery(p => ({ ...p, phone: e.target.value }))}
                                        placeholder="e.g. +91 98765 43210"
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">📍 Delivery Address</label>
                                    <textarea
                                        value={drawerDelivery.address}
                                        onChange={e => setDrawerDelivery(p => ({ ...p, address: e.target.value }))}
                                        rows={3}
                                        placeholder="House / Flat, Street, Area, City, PIN"
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">🏠 Landmark / Notes</label>
                                    <input
                                        value={drawerDelivery.notes}
                                        onChange={e => setDrawerDelivery(p => ({ ...p, notes: e.target.value }))}
                                        placeholder="Near school, blue gate, 2nd floor..."
                                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                                    />
                                </div>
                                {/* Save to profile option */}
                                <label className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 cursor-pointer hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="accent-indigo-600 mt-0.5"
                                        checked={drawerDelivery.updateUserProfile}
                                        onChange={e => setDrawerDelivery(p => ({ ...p, updateUserProfile: e.target.checked }))}
                                    />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700">Save to customer profile</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Update their default phone &amp; address for future orders. Uncheck for gift / alternate address.</p>
                                    </div>
                                </label>
                            </section>

                            {/* Order Items */}
                            <section className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <h3 className="text-sm font-semibold text-gray-800">Items Ordered</h3>
                                </div>
                                <div className="space-y-2">
                                    {drawerOrder.items.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                {item.product.images[0] && (
                                                    <img src={item.product.images[0]} alt={item.product.name} className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.product.name}</p>
                                                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-semibold text-gray-700 shrink-0">{formatInr(Number(item.price) * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Shiprocket Delivery Integration */}
                            <section className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Package className="w-4 h-4 text-indigo-500" />
                                    <h3 className="text-sm font-semibold text-gray-800">Shiprocket Fulfillment</h3>
                                </div>
                                {drawerOrder.shiprocketOrderId ? (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Order Pushed to Shiprocket</p>
                                        <div className="mt-2 text-xs text-emerald-700">
                                            {drawerOrder.awbCode ? (
                                                <div className="flex items-center justify-between">
                                                    <span>AWB: <strong>{drawerOrder.awbCode}</strong></span>
                                                    {drawerOrder.trackingUrl && (
                                                        <a href={drawerOrder.trackingUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-semibold bg-white px-2 py-0.5 rounded shadow-sm">Track Package</a>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="opacity-75">AWB generation pending...</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-gray-500">Push this order to Shiprocket once confirming delivery details and order readiness.</p>
                                        {(drawerOrder.status !== "PAID" && drawerOrder.status !== "CONFIRMED") ? (
                                            <p className="text-xs text-amber-600 font-medium">Only PAID or CONFIRMED orders can be pushed.</p>
                                        ) : (
                                            <button
                                                onClick={handlePushShiprocket}
                                                disabled={pushingShiprocket}
                                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                                            >
                                                {pushingShiprocket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                                                {pushingShiprocket ? "Pushing to Shiprocket..." : "Push to Shiprocket"}
                                            </button>
                                        )}
                                        {shiprocketError && <p className="text-xs font-semibold text-red-600">{shiprocketError}</p>}
                                    </div>
                                )}
                            </section>

                            {/* Payment Summary */}
                            <section className="rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <h3 className="text-sm font-semibold text-gray-800">Payment Summary</h3>
                                </div>
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between text-gray-500"><span>Method</span><span className="font-medium text-gray-700">{drawerOrder.paymentMethod || "—"}</span></div>
                                    <div className="flex justify-between text-gray-500"><span>Status</span><span className="font-medium text-gray-700">{drawerOrder.paymentStatus || "PENDING"}</span></div>
                                    {Number(drawerOrder.paidAmount) > 0 && (
                                        <div className="flex justify-between text-gray-500"><span>Paid</span><span className="font-medium text-gray-700">{formatInr(Number(drawerOrder.paidAmount))}</span></div>
                                    )}
                                    {Number(drawerOrder.shippingAmount) > 0 && (
                                        <div className="flex justify-between text-gray-500"><span>Shipping</span><span className="font-medium text-gray-700">{formatInr(Number(drawerOrder.shippingAmount))}</span></div>
                                    )}
                                    <div className="flex justify-between border-t border-gray-100 pt-2 font-bold">
                                        <span className="text-gray-800">Total</span>
                                        <span className="text-indigo-600">{formatInr(Number(drawerOrder.total))}</span>
                                    </div>
                                </div>
                            </section>

                        </div>

                        {/* Footer — Save button */}
                        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                            {drawerSaved && (
                                <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> Delivery details saved successfully!
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDrawerOrder(null)}
                                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleSaveDelivery}
                                    disabled={drawerSaving}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                                >
                                    {drawerSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {drawerSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

