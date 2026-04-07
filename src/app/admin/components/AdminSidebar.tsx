"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, LogOut, Package, Users, Settings, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui/Logo";

const NAV = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/users", label: "Customers", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { signOut, user, dbUser, loading } = useAuth();
    
    // Check both DB and Metadata to fix sync lag
    const tokenRole = String(user?.app_metadata?.role || user?.user_metadata?.role || '').toUpperCase();
    const dbRole = (dbUser?.role || '').toUpperCase();
    
    const isAdmin = tokenRole === 'ADMIN' || dbRole === 'ADMIN';

    // While loading, show nothing. 
    // If NOT admin, show the restricted Staff menu. Only show full NAV if explicitly ADMIN.
    const filteredNav = loading ? [] : (isAdmin
        ? NAV
        : NAV.filter(item => item.label !== "Dashboard" && item.label !== "Analytics"));

    const handleLogout = async () => {
        await signOut();
        router.push("/");
    };

    return (
        <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white flex flex-col border-r border-gray-200">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-gray-100">
                <Link href="/admin" className="block focus:outline-none">
                    <Logo variant="full" onDark={false} className="h-10 w-auto" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mt-2 pl-0.5">Admin Console</p>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 py-2 mb-1">Navigation</p>
                {filteredNav.map(({ href, label, icon: Icon }) => {
                    const isActive = href === "/admin"
                        ? pathname === href
                        : pathname === href || pathname.startsWith(`${href}/`);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                            <span className="flex-1">{label}</span>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
                {isAdmin && (
                    <Link
                        href="/admin/settings"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all"
                    >
                        <Settings className="w-4 h-4 text-gray-400" />
                        <span>Settings</span>
                    </Link>
                )}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                >
                    <LogOut className="w-4 h-4 text-gray-400" />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
