"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartModal } from "@/components/layout/CartModal";
import { BackToTop } from "@/components/BackToTop";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { StickyDiscountTab } from "@/components/ui/StickyDiscountTab";

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith("/admin");

    if (isAdminRoute) {
        return <main className="flex-grow">{children}</main>;
    }

    return (
        <>
            <Navbar />
            <CartModal />
            <StickyDiscountTab />
            <main className="flex-grow pb-24 md:pb-0">{children}</main>
            <BackToTop />
            <MobileBottomNav />
            <Footer />
        </>
    );
}
