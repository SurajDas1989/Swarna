"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search, ShoppingBag } from "lucide-react";
import { getOrderReference } from "@/lib/order-reference";

interface Order {
    id: string;
    orderNumber?: string | null;
    status: string;
    total: number;
    createdAt: string;
    guestEmail?: string | null;
    guestFirstName?: string | null;
    guestLastName?: string | null;
    user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
    items: { quantity: number; price: number; product: { name: string; images: string[] } }[];
    refundedAmount?: number;
    storeCreditUsed?: number;
}

const ALL_STATUSES = ["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "PAID"];

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
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
        } catch (err: any) {
            alert(err.message);
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
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

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
                                                    {["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "PAID"].map(s => (
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
                                    onChange={(e) => setRefundMethod(e.target.value as any)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="ORIGINAL" className="bg-[#1a1a1a]">Split (Wallet First, then Razorpay)</option>
                                    <option value="STORE_CREDIT_ONLY" className="bg-[#1a1a1a]">100% Store Credit Only (Fast)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Refund Amount (₹)</label>
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

