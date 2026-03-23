"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, LogOut, ChevronRight, Store, Users, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        router.push("/");
    };

    return (
        <aside className="w-64 shrink-0 h-screen sticky top-0 bg-[#111] text-white flex flex-col border-r border-white/10">
            {/* Logo */}
            <div className="p-6 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Store className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-white leading-none">Swarna</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Admin Panel</p>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${isActive
                                    ? "bg-primary text-background"
                                    : "text-gray-400 hover:text-white hover:bg-white/10"
                                }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1">{label}</span>
                            {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
                <Link
                    href="/"
                    className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition-all mt-1"
                >
                    ← Back to Store
                </Link>
            </div>
        </aside>
    );
}
