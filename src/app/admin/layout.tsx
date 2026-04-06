"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "./components/AdminSidebar";
import { Loader2, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

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
            <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">Loading workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fb] text-gray-900 flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
                <AdminSidebar />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center gap-4 px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
                    </button>
                    <Logo variant="full" onDark={false} className="h-8 w-auto" />
                </div>

                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
