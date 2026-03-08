"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "./components/AdminSidebar";
import { Loader2, Menu, X } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace("/login");
            return;
        }

        // Check admin role from DB
        fetch("/api/admin/stats")
            .then(res => {
                if (res.status === 403) {
                    router.replace("/");
                } else {
                    setIsAdmin(true);
                }
            })
            .catch(() => router.replace("/"));
    }, [user, loading, router]);

    if (loading || isAdmin === null) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading admin panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — desktop always visible, mobile slide-in */}
            <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <AdminSidebar />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center gap-4 px-4 py-3 bg-[#111] border-b border-white/10 sticky top-0 z-30">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/10">
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <p className="font-bold text-white">Swarna Admin</p>
                </div>

                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
