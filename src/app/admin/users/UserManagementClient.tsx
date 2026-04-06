"use client";

import { useState } from "react";
import {
    Search, Loader2, Download, Upload, Plus, Users, TrendingUp,
    IndianRupee, MapPin, Mail, ChevronRight, Filter, X, CreditCard, CheckCircle2, Wallet
} from "lucide-react";
import toast from "react-hot-toast";

type UserType = {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    storeCredit: number;
    createdAt: Date;
    orderCount: number;
    totalSpent: number;
    address: string | null;
};

type StatsType = {
    totalCustomers: number;
    newCustomers: number;
    totalRevenue: number;
};

const formatMoney = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

const FILTER_OPTIONS = [
    { key: "subscribed", label: "Subscribed", icon: "📧" },
    { key: "has_orders", label: "Has Orders", icon: "🛍️" },
    { key: "admin", label: "Admin", icon: "🔑" },
];

const STATUS_STYLE = {
    active:  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
    admin:   { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-400" },
};

export function UserManagementClient({ initialUsers, stats }: { initialUsers: UserType[]; stats: StatsType }) {
    const [users, setUsers] = useState<UserType[]>(initialUsers);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [filterType, setFilterType] = useState<string | null>(null);
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({ email: "", firstName: "", lastName: "", phone: "", address: "" });
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const filteredUsers = users.filter(u => {
        const matchesSearch =
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            (u.firstName && u.firstName.toLowerCase().includes(search.toLowerCase())) ||
            (u.lastName && u.lastName.toLowerCase().includes(search.toLowerCase()));
        const matchesFilter =
            !filterType ||
            (filterType === "has_orders" && u.orderCount > 0) ||
            (filterType === "admin" && u.role === "ADMIN") ||
            (filterType === "subscribed" && u.role !== "ADMIN");
        return matchesSearch && matchesFilter;
    });

    const handleExport = () => {
        const headers = ["ID", "Email", "First Name", "Last Name", "Address", "Role", "Store Credit", "Orders", "Total Spent", "Joined Date"];
        const rows = users.map(u => [
            u.id, u.email, u.firstName || "", u.lastName || "",
            (u.address || "").replace(/,/g, " "), u.role,
            u.storeCredit, u.orderCount, u.totalSpent,
            new Date(u.createdAt).toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `swarna-customers-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        toast.success("Customer list exported");
    };

    const handleAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCustomerForm)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUsers([data.user, ...users]);
            toast.success("Customer created");
            setIsAddModalOpen(false);
            setNewCustomerForm({ email: "", firstName: "", lastName: "", phone: "", address: "" });
        } catch (err: any) { toast.error(err.message || "Failed to create customer"); }
        finally { setIsLoading(false); }
    };

    const handleIssueCredit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/credit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: selectedUser.id, amount: parseFloat(amount), reason })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setUsers(users.map(u => u.id === selectedUser.id ? { ...u, storeCredit: Number(data.updatedStoreCredit) } : u));
            toast.success("Credit updated");
            setSelectedUser(null); setAmount(""); setReason("");
        } catch (err: any) { toast.error(err.message || "Failed to update credit"); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{stats.totalCustomers} total accounts in your database</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <Upload className="w-4 h-4" /> Import
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Add Customer
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 border-l-4 border-l-indigo-500 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Customers</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-emerald-500" /> 100% of base
                            </p>
                        </div>
                        <div className="p-2.5 bg-indigo-50 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 border-l-4 border-l-sky-500 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">New (30 Days)</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{stats.newCustomers}</p>
                            <p className="text-xs text-gray-400 mt-1">Recent signups</p>
                        </div>
                        <div className="p-2.5 bg-sky-50 rounded-lg">
                            <Plus className="w-5 h-5 text-sky-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 border-l-4 border-l-emerald-500 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lifetime Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-1">{formatMoney(stats.totalRevenue)}</p>
                            <p className="text-xs text-gray-400 mt-1">Across all orders</p>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-lg">
                            <IndianRupee className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all text-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterMenuOpen(v => !v)}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border rounded-lg transition-all ${
                                filterType
                                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            <Filter className="w-4 h-4" />
                            {filterType ? FILTER_OPTIONS.find(f => f.key === filterType)?.label : "Filter"}
                            {filterType && (
                                <span onClick={e => { e.stopPropagation(); setFilterType(null); }} className="hover:text-red-500 cursor-pointer">
                                    <X className="w-3.5 h-3.5" />
                                </span>
                            )}
                        </button>
                        {isFilterMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsFilterMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                    <div className="px-3 py-2.5 border-b border-gray-100">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Filter by</p>
                                    </div>
                                    {FILTER_OPTIONS.map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => { setFilterType(filterType === opt.key ? null : opt.key); setIsFilterMenuOpen(false); }}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors ${
                                                filterType === opt.key
                                                    ? "bg-indigo-50 text-indigo-700"
                                                    : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                        >
                                            <span className="flex items-center gap-2.5">{opt.icon} {opt.label}</span>
                                            {filterType === opt.key && <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-5 py-3 w-10"><input type="checkbox" className="rounded border-gray-300" /></th>
                                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Orders</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Spent</th>
                                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Credit</th>
                                <th className="px-5 py-3 w-10" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map(user => {
                                const isAdmin = user.role === "ADMIN";
                                const s = isAdmin ? STATUS_STYLE.admin : STATUS_STYLE.active;
                                const initials = (user.firstName?.[0] || user.email[0]).toUpperCase();
                                return (
                                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors group">
                                        <td className="px-5 py-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                                    {initials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">
                                                        {user.firstName || user.lastName ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "Unnamed User"}
                                                    </p>
                                                    <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                                                        <Mail className="w-2.5 h-2.5" /> {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                {isAdmin ? "Admin" : "Active"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <span className="truncate max-w-[160px]">{user.address || "—"}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-semibold ${
                                                user.orderCount > 0 ? "bg-indigo-50 text-indigo-700" : "bg-gray-100 text-gray-400"
                                            }`}>
                                                {user.orderCount}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-semibold text-gray-800">{formatMoney(user.totalSpent)}</td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className={`text-xs font-semibold transition-colors hover:underline underline-offset-2 ${
                                                    user.storeCredit > 0 ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"
                                                }`}
                                            >
                                                {formatMoney(user.storeCredit)}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto mb-4">
                                            <Search className="w-7 h-7 text-gray-300" />
                                        </div>
                                        <p className="text-sm font-semibold text-gray-600">No customers found</p>
                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter.</p>
                                        <button onClick={() => { setSearch(""); setFilterType(null); }} className="mt-4 text-sm text-indigo-600 hover:underline font-medium">Clear filters</button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <p className="text-xs text-gray-400 font-medium">{filteredUsers.length} of {users.length} customers</p>
                </div>
            </div>

            {/* ---- MODALS ---- */}

            {/* Add Customer Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">New Customer</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Manually add a customer record</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                                    <input type="text" placeholder="Suraj" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none text-sm" value={newCustomerForm.firstName} onChange={e => setNewCustomerForm({ ...newCustomerForm, firstName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                                    <input type="text" placeholder="Das" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none text-sm" value={newCustomerForm.lastName} onChange={e => setNewCustomerForm({ ...newCustomerForm, lastName: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" required placeholder="customer@example.com" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none text-sm" value={newCustomerForm.email} onChange={e => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                <textarea rows={2} placeholder="Street, City, State..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none text-sm resize-none" value={newCustomerForm.address} onChange={e => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex-[2] py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Save Customer</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 text-center">
                        <div className="p-3 bg-indigo-50 rounded-xl w-fit mx-auto mb-4">
                            <Upload className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Import Customers</h2>
                        <p className="text-sm text-gray-500 mb-6">Upload a CSV with headers: <strong className="text-gray-700">Email, Name, Phone, Address</strong></p>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 mb-6 hover:border-indigo-300 cursor-pointer transition-colors">
                            <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 font-medium">Click to select CSV file</p>
                            <input type="file" className="hidden" accept=".csv" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
                            <button onClick={() => toast.error("Import coming soon")} className="flex-[2] py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all">Upload</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Credit Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setSelectedUser(null); setAmount(""); setReason(""); }} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <CreditCard className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-gray-900">Adjust Credit</h2>
                                    <p className="text-xs text-gray-400">Current: <strong className="text-indigo-600">{formatMoney(selectedUser.storeCredit)}</strong></p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleIssueCredit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (INR)</label>
                                <input type="number" step="0.01" required placeholder="e.g. 500 or -200" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none text-sm font-semibold" value={amount} onChange={e => setAmount(e.target.value)} />
                                <p className="text-[10px] text-gray-400 mt-1">Positive to add, negative to deduct</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Reason</label>
                                <input type="text" required placeholder="e.g. Loyalty bonus" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none text-sm" value={reason} onChange={e => setReason(e.target.value)} />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => { setSelectedUser(null); setAmount(""); setReason(""); }} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">Cancel</button>
                                <button type="submit" disabled={isLoading} className="flex-[2] py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
