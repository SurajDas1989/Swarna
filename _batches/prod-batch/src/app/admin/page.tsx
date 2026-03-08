"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrderReference } from "@/lib/order-reference";
import {
    ShoppingBag, Users, TrendingUp, Clock,
    ArrowUpRight, Package, RefreshCw
} from "lucide-react";

interface Stats {
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    pendingOrders: number;
}

interface Order {
    id: string;
    status: string;
    total: number;
    orderNumber?: string | null;
    createdAt: string;
    guestEmail?: string | null;
    guestFirstName?: string | null;
    guestLastName?: string | null;
    user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
    items: { product: { name: string } }[];
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    SHIPPED: "bg-purple-500/20 text-purple-400",
    DELIVERED: "bg-emerald-500/20 text-emerald-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    PAID: "bg-emerald-500/20 text-emerald-400",
};

const formatInr = (value: number) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
}).format(Number(value));

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [statsRes, ordersRes] = await Promise.all([
            fetch("/api/admin/stats"),
            fetch("/api/admin/orders"),
        ]);
        setStats(await statsRes.json());
        const allOrders = await ordersRes.json();
        setRecentOrders((Array.isArray(allOrders) ? allOrders : []).slice(0, 5));
        setLoading(false);
    };

    useEffect(() => {
        const id = requestAnimationFrame(() => {
            void fetchData();
        });
        return () => cancelAnimationFrame(id);
    }, []);

    const statCards = stats ? [
        {
            label: "Total Orders",
            value: stats.totalOrders,
            icon: ShoppingBag,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
        },
        {
            label: "Total Revenue",
            value: formatInr(Number(stats.totalRevenue)),
            icon: TrendingUp,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
        },
        {
            label: "Customers",
            value: stats.totalCustomers,
            icon: Users,
            color: "text-purple-400",
            bg: "bg-purple-500/10",
        },
        {
            label: "Pending Orders",
            value: stats.pendingOrders,
            icon: Clock,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10",
        },
    ] : [];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-1">Welcome back, Admin</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-lg transition-all"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {loading
                    ? Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse h-32" />
                    ))
                    : statCards.map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-gray-400 text-sm font-medium">{label}</p>
                                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 ${color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{value}</p>
                        </div>
                    ))
                }
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold text-white">Recent Orders</h2>
                    </div>
                    <Link
                        href="/admin/orders"
                        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                        View all <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {loading ? (
                    <div className="p-6 space-y-4">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No orders yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b border-white/5">
                                    <th className="text-left px-6 py-3 font-medium">Order ID</th>
                                    <th className="text-left px-6 py-3 font-medium">Customer</th>
                                    <th className="text-left px-6 py-3 font-medium">Items</th>
                                    <th className="text-left px-6 py-3 font-medium">Total</th>
                                    <th className="text-left px-6 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentOrders.map(order => {
                                    const customerName = `${order.user?.firstName || order.guestFirstName || "Guest"} ${order.user?.lastName || order.guestLastName || ""}`.trim();
                                    const customerEmail = order.user?.email || order.guestEmail || "No email";

                                    return (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-400">
                                                {getOrderReference({ orderNumber: order.orderNumber, orderId: order.id, createdAt: order.createdAt })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-white font-medium">{customerName}</p>
                                                <p className="text-gray-500 text-xs">{customerEmail}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-primary">{formatInr(Number(order.total))}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-500/20 text-gray-400"}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

