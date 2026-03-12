"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { Home, Menu, Search, ShoppingCart, User } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOBILE_BOTTOM_NAV !== "false";
const MOBILE_SEARCH_FOCUS_KEY = "mobile-search-focus";

type NavKey = "home" | "menu" | "search" | "cart" | "account";

const NAV_ITEMS: Array<{ key: NavKey; label: string; icon: ComponentType<{ className?: string }> }> = [
    { key: "home", label: "Home", icon: Home },
    { key: "menu", label: "Menu", icon: Menu },
    { key: "search", label: "Search", icon: Search },
    { key: "cart", label: "Cart", icon: ShoppingCart },
    { key: "account", label: "Account", icon: User },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const shouldReduceMotion = useReducedMotion();
    const { cartCount, setIsCartOpen, isCartOpen } = useAppContext();
    const { user } = useAuth();
    const [transientActive, setTransientActive] = useState<NavKey | null>(null);

    const isHiddenRoute = pathname.startsWith("/admin");

    const activeKey: NavKey = useMemo(() => {
        if (transientActive) return transientActive;
        if (isCartOpen) return "cart";
        if (pathname.startsWith("/profile")) return "account";
        return "home";
    }, [isCartOpen, pathname, transientActive]);

    if (!ENABLED || isHiddenRoute) {
        return null;
    }

    const activeIndex = NAV_ITEMS.findIndex((item) => item.key === activeKey);

    const pulseActive = (key: NavKey) => {
        setTransientActive(key);
        window.setTimeout(() => {
            setTransientActive((curr) => (curr === key ? null : curr));
        }, 450);
    };

    const onTap = (key: NavKey) => {
        switch (key) {
            case "home":
                pulseActive("home");
                router.push("/");
                break;
            case "menu":
                pulseActive("menu");
                window.dispatchEvent(new CustomEvent("open-mobile-menu"));
                break;
            case "search":
                pulseActive("search");
                sessionStorage.setItem(MOBILE_SEARCH_FOCUS_KEY, "1");
                router.push("/#products");
                window.setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("focus-products-search"));
                }, 180);
                break;
            case "cart":
                pulseActive("cart");
                setIsCartOpen(true);
                break;
            case "account":
                pulseActive("account");
                router.push(user ? "/profile" : "/login");
                break;
            default:
                break;
        }
    };

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200/70 bg-white/95 px-3 pb-2 pt-2 shadow-[0_-10px_24px_rgba(8,8,8,0.08)] backdrop-blur dark:border-white/10 dark:bg-[#121212]/95 md:hidden isolate"
            style={{ 
                paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)",
                transform: "translateZ(0)",
                WebkitTransform: "translateZ(0)"
            }}
            aria-label="Mobile bottom navigation"
        >
            <div className="mx-auto w-full max-w-md">
                <div className="relative grid grid-cols-5 items-center gap-1 rounded-2xl border border-gray-200/70 bg-white/80 p-1 dark:border-white/10 dark:bg-white/[0.04]">
                    <motion.div
                        aria-hidden="true"
                        className="absolute inset-y-1 left-1 w-[calc(20%-0.2rem)] rounded-xl bg-primary/14"
                        animate={{ x: `${Math.max(activeIndex, 0) * 100}%` }}
                        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
                    />

                    {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                        const isActive = activeKey === key;

                        return key === "home" ? (
                            <Link
                                key={key}
                                href="/"
                                onClick={() => onTap("home")}
                                className={`relative z-10 flex min-h-[54px] flex-col items-center justify-center rounded-xl px-1 py-1 text-[11px] leading-none transition-colors ${
                                    isActive
                                        ? "font-semibold text-foreground dark:text-white"
                                        : "font-medium text-gray-600 dark:text-gray-300"
                                }`}
                            >
                                <motion.div
                                    whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                                    transition={{ duration: 0.18 }}
                                    className="flex flex-col items-center gap-1"
                                >
                                    <Icon className="h-[18px] w-[18px]" />
                                    <span className="whitespace-nowrap">{label}</span>
                                </motion.div>
                            </Link>
                        ) : (
                            <button
                                key={key}
                                onClick={() => onTap(key)}
                                className={`relative z-10 flex min-h-[54px] flex-col items-center justify-center rounded-xl px-1 py-1 text-[11px] leading-none transition-colors ${
                                    isActive
                                        ? "font-semibold text-foreground dark:text-white"
                                        : "font-medium text-gray-600 dark:text-gray-300"
                                }`}
                                aria-label={label}
                            >
                                <motion.div
                                    whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                                    transition={{ duration: 0.18 }}
                                    className="relative flex flex-col items-center gap-1"
                                >
                                    <Icon className="h-[18px] w-[18px]" />
                                    {key === "cart" && cartCount > 0 && (
                                        <span className="absolute -right-2 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                                            {cartCount}
                                        </span>
                                    )}
                                    <span className="whitespace-nowrap">{label}</span>
                                </motion.div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}
