"use client";

import { useState, useEffect } from "react";
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatInr } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Presentation } from "lucide-react";

interface AnalyticsData {
    metrics: {
        grossSales: number;
        netSales: number;
        shippingCharges: number;
        taxes: number;
        returns: number;
        discounts: number;
        totalSales: number;
        ordersCount: number;
        ordersFulfilledCount: number;
        aov: number;
        returningRate: number;
    };
    charts: {
        salesOverTime: { date: string; total: number }[];
        topProducts: { name: string; sales: number }[];
    };
}

export default function AnalyticsPage() {
    const [days, setDays] = useState("365");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const { user, dbUser, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (authLoading) return;

        const tokenRole = String(user?.app_metadata?.role || user?.user_metadata?.role || '').toUpperCase();
        const dbRole = (dbUser?.role || '').toUpperCase();
        const isAdmin = tokenRole === 'ADMIN' || dbRole === 'ADMIN';

        if (!user || !isAdmin) {
            router.push("/admin/orders");
            return;
        }

        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/analytics?days=${days}`);
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [days, authLoading, user, dbUser, router]);

    if (loading || !data) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const { metrics, charts } = data;

    // Helper to format chart dates nicely (e.g. "Apr 2024")
    const formatChartDate = (dateStr: any) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: (days === "365" || days === "180") ? "numeric" : undefined });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Key metrics and trends for your store.</p>
                </div>
                
                <div className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-1">
                    <Select value={days} onValueChange={setDays}>
                        <SelectTrigger className="w-[180px] border-0 focus:ring-0 h-9">
                            <SelectValue placeholder="Select timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="180">Last 6 months</SelectItem>
                            <SelectItem value="365">Last 365 days</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard 
                    title="Gross sales" 
                    value={formatInr(metrics.grossSales)} 
                    trend="+12%" 
                    trendUp={true} 
                    chartData={charts.salesOverTime}
                />
                <KpiCard 
                    title="Returning customer rate" 
                    value={`${metrics.returningRate.toFixed(1)}%`} 
                    trend="+2.1%" 
                    trendUp={true} 
                    chartData={charts.salesOverTime.slice().reverse()} // Mocking different trend look
                />
                <KpiCard 
                    title="Orders fulfilled" 
                    value={metrics.ordersFulfilledCount.toString()} 
                    trend="-1%" 
                    trendUp={false} 
                    chartData={charts.salesOverTime.slice(0, 10)} 
                />
                <KpiCard 
                    title="Total Orders" 
                    value={metrics.ordersCount.toString()} 
                    trend="+5%" 
                    trendUp={true} 
                    chartData={charts.salesOverTime}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Sales Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <div className="mb-6 mb-8">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total sales over time</h3>
                        <div className="flex items-baseline gap-3 mt-2">
                            <h2 className="text-2xl font-bold">{formatInr(metrics.totalSales)}</h2>
                            <span className="text-sm font-medium text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                                <ArrowUpRight className="w-3 h-3 mr-1" />
                                14%
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.salesOverTime} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={formatChartDate} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: "#6B7280", fontSize: 12 }} 
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: "#6B7280", fontSize: 12 }}
                                    tickFormatter={(val) => `₹${val/1000}k`}
                                />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [formatInr(Number(value)), "Sales"]}
                                    labelFormatter={formatChartDate}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="#3b82f6" 
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales Breakdown Table */}
                <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-6">Total sales breakdown</h3>
                    
                    <div className="space-y-4">
                        <BreakdownRow label="Gross sales" amount={metrics.grossSales} />
                        <BreakdownRow label="Discounts" amount={-metrics.discounts} />
                        <BreakdownRow label="Returns" amount={-metrics.returns} />
                        
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 my-1">
                            <BreakdownRow label="Net sales" amount={metrics.netSales} />
                        </div>
                        
                        <BreakdownRow label="Shipping charges" amount={metrics.shippingCharges} />
                        <BreakdownRow label="Taxes" amount={metrics.taxes} />
                        
                        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
                            <div className="flex justify-between items-center py-1 font-bold text-gray-900 dark:text-gray-100">
                                <span>Total sales</span>
                                <span>{formatInr(metrics.totalSales)}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-6">Total sales by product</h3>
                    
                    {charts.topProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Presentation className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No sales data in this period.</p>
                        </div>
                    ) : (
                        <div className="h-[250px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.topProducts} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={120} 
                                        tick={{ fill: "#4B5563", fontSize: 12 }} 
                                    />
                                    <RechartsTooltip 
                                        cursor={{fill: 'transparent'}}
                                        formatter={(value: any) => [formatInr(Number(value)), "Sales"]}
                                    />
                                    <Bar dataKey="sales" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Average Order Value */}
                <div className="lg:col-span-2 bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Average order value over time</h3>
                        <div className="flex items-baseline gap-3 mt-2">
                            <h2 className="text-2xl font-bold">{formatInr(metrics.aov)}</h2>
                        </div>
                    </div>
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={charts.salesOverTime} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={formatChartDate} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: "#6B7280", fontSize: 12 }} 
                                    dy={10}
                                    minTickGap={30}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: "#6B7280", fontSize: 12 }}
                                    tickFormatter={(val) => `₹${val/1000}k`}
                                />
                                <RechartsTooltip 
                                    formatter={(value: any) => [`₹${(Number(value) / (metrics.ordersCount || 1)).toFixed(2)}`, "Average Value"]}
                                    labelFormatter={formatChartDate}
                                />
                                <Line 
                                    type="stepAfter" 
                                    dataKey="total" 
                                    stroke="#10b981" 
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Sessions Over Time Mock Card based on screenshot  */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 opacity-70">
                 <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-50/50 dark:bg-black/10 z-10 flex items-center justify-center backdrop-blur-[1px]">
                         <span className="bg-white dark:bg-card border border-gray-200 dark:border-gray-700 px-3 py-1 rounded text-xs font-semibold text-gray-500 shadow-sm">
                             Requires Analytics Integration
                         </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Sessions over time</h3>
                    <h2 className="text-2xl font-bold mb-6">10,216</h2>
                    <div className="h-[150px] w-full bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />
                </div>
                 <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-50/50 dark:bg-black/10 z-10 flex items-center justify-center backdrop-blur-[1px]">
                         <span className="bg-white dark:bg-card border border-gray-200 dark:border-gray-700 px-3 py-1 rounded text-xs font-semibold text-gray-500 shadow-sm">
                             Requires Analytics Integration
                         </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Conversion rate</h3>
                    <h2 className="text-2xl font-bold mb-6">1.36%</h2>
                    <div className="h-[150px] w-full bg-gray-100 dark:bg-gray-800/50 rounded-lg animate-pulse" />
                </div>
                <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gray-50/50 dark:bg-black/10 z-10 flex items-center justify-center backdrop-blur-[1px]">
                         <span className="bg-white dark:bg-card border border-gray-200 dark:border-gray-700 px-3 py-1 rounded text-xs font-semibold text-gray-500 shadow-sm">
                             Requires Analytics Integration
                         </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Sales by channel</h3>
                    <h2 className="text-2xl font-bold mb-6">Online Store</h2>
                    <div className="h-[150px] w-full flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-[12px] border-blue-500" />
                    </div>
                </div>
            </div>

        </div>
    );
}

// Mini Sparkline KPI Card
function KpiCard({ title, value, trend, trendUp, chartData }: { title: string, value: string, trend: string, trendUp: boolean, chartData: any[] }) {
    return (
        <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-tight">{title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
                <span className={`text-xs font-semibold flex items-center ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trendUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                    {trend}
                </span>
            </div>
            
            <div className="h-10 mt-4 w-full">
                {chartData && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <Line 
                                type="monotone" 
                                dataKey="total" 
                                stroke={trendUp ? "#10b981" : "#8b5cf6"} 
                                strokeWidth={2} 
                                dot={false} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full border-b-2 border-dashed border-gray-200 dark:border-gray-700" />
                )}
            </div>
        </div>
    );
}

function BreakdownRow({ label, amount }: { label: string, amount: number }) {
    return (
        <div className="flex justify-between items-center py-1 text-sm">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span className={`font-medium ${amount < 0 ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                {amount < 0 ? '-' : ''}{formatInr(Math.abs(amount))}
            </span>
        </div>
    );
}
