"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getOrderReference } from "@/lib/order-reference";
import {
    ShoppingBag, TrendingUp, Clock,
    ArrowUpRight, Package, RefreshCw, Users, IndianRupee, AlertCircle
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

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING:    { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
    CONFIRMED:  { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-400" },
    PROCESSING: { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400" },
    SHIPPED:    { bg: "bg-sky-50",     text: "text-sky-700",     dot: "bg-sky-400" },
    DELIVERED:  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
    CANCELLED:  { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400" },
    PAID:       { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
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
    const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

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
        const id = requestAnimationFrame(() => { void fetchData(); });
        return () => cancelAnimationFrame(id);
    }, []);

    const statCards = stats ? [
        {
            label: "Total Revenue",
            value: formatInr(Number(stats.totalRevenue)),
            icon: IndianRupee,
            border: "border-l-indigo-500",
            iconBg: "bg-indigo-50",
            iconColor: "text-indigo-600",
            sub: "All confirmed orders",
        },
        {
            label: "Total Orders",
            value: stats.totalOrders,
            icon: ShoppingBag,
            border: "border-l-sky-500",
            iconBg: "bg-sky-50",
            iconColor: "text-sky-600",
            sub: "Lifetime order count",
        },
        {
            label: "Pending Orders",
            value: stats.pendingOrders,
            icon: AlertCircle,
            border: "border-l-amber-500",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            sub: "Requires attention",
        },
        {
            label: "Total Customers",
            value: stats.totalCustomers,
            icon: Users,
            border: "border-l-emerald-500",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            sub: "Registered accounts",
        },
    ] : [];

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{today}</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-lg transition-all shadow-sm"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {loading
                    ? Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse h-28 shadow-sm" />
                    ))
                    : statCards.map(({ label, value, icon: Icon, border, iconBg, iconColor, sub }) => (
                        <div key={label} className={`bg-white border border-gray-200 border-l-4 ${border} rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                                    <p className="text-xs text-gray-400 mt-1">{sub}</p>
                                </div>
                                <div className={`p-2.5 ${iconBg} rounded-lg`}>
                                    <Icon className={`w-5 h-5 ${iconColor}`} />
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { href: "/admin/orders", label: "Manage Orders", icon: ShoppingBag, color: "text-sky-600", bg: "bg-sky-50/50" },
                    { href: "/admin/users", label: "View Customers", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50/50" },
                    { href: "/admin/products", label: "Edit Products", icon: Package, color: "text-emerald-600", bg: "bg-emerald-50/50" },
                ].map(({ href, label, icon: Icon, color, bg }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all group`}
                    >
                        <div className={`p-2 ${bg} rounded-lg`}>
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{label}</span>
                        <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
                    </Link>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                            <Package className="w-4 h-4 text-indigo-600" />
                        </div>
                        <h2 className="text-sm font-bold text-gray-800">Recent Orders</h2>
                        {!loading && (
                            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                {recentOrders.length}
                            </span>
                        )}
                    </div>
                    <Link
                        href="/admin/orders"
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                        View all <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>

                {loading ? (
                    <div className="p-6 space-y-3">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : recentOrders.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                            <ShoppingBag className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500">No orders yet</p>
                        <p className="text-xs text-gray-400 mt-1">Orders will appear here once customers place them.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Order ID</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Items</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentOrders.map(order => {
                                    const customerName = `${order.user?.firstName || order.guestFirstName || "Guest"} ${order.user?.lastName || order.guestLastName || ""}`.trim();
                                    const customerEmail = order.user?.email || order.guestEmail || "No email";
                                    const s = STATUS_STYLES[order.status] ?? { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500 font-medium">
                                                {getOrderReference({ orderNumber: order.orderNumber, orderId: order.id, createdAt: order.createdAt })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-800 text-sm">{customerName}</p>
                                                <p className="text-gray-400 text-xs mt-0.5">{customerEmail}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-medium">
                                                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-800">{formatInr(Number(order.total))}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
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
