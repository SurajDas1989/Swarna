"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon, Search, ShoppingCart, Menu, X, User, Heart, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Logo } from "@/components/ui/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useShipping } from "@/context/ShippingContext";

export function Navbar() {
    const router = useRouter();
    const { 
        wishlistCount, 
        cartCount, 
        setIsCartOpen, 
        searchQuery, 
        setSearchQuery,
        setActiveCategory,
    } = useAppContext();
    const { user, dbUser, signOut } = useAuth();
    const { resolvedTheme, toggleTheme } = useTheme();
    const { pincode, setPincode } = useShipping();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleOpenMenu = () => setMobileMenuOpen(true);
        window.addEventListener("open-mobile-menu", handleOpenMenu);
        return () => window.removeEventListener("open-mobile-menu", handleOpenMenu);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (e.target.value.length > 0) {
            router.push('/#products');
        }
    };

    const navLinks = [
        { href: '/#home', label: 'Home' },
        { href: '/#products', label: 'Shop' },
        { href: '/#categories', label: 'Categories' },
        { href: '/#our-story', label: 'Our Story' },
        { href: '/#contact', label: 'Contact' },
    ];

    const whatsappHref = "https://wa.me/919326901595";

    return (
        <>
            {/* Announcement Bar - Exists in normal flow so it scrolls off naturally */}
            <div className="overflow-hidden border-b border-primary/15 bg-[#171717] py-2 text-sm text-stone-100 dark:border-white/10 dark:bg-[#101010]">
                <div className="container relative mx-auto flex items-center justify-between px-4">
                    <div className="flex w-full items-center overflow-hidden whitespace-nowrap">
                        <div className="inline-block animate-[marquee_20s_linear_infinite] font-medium tracking-wide text-stone-100/95">
                            {"✨ Free Shipping on Orders Above ₹799 • Discover the Premium Wedding Collection"}
                        </div>
                    </div>
                </div>
            </div>

            <header 
                className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
                    isScrolled 
                    ? "border-b border-primary/10 bg-background/70 shadow-lg backdrop-blur-2xl py-2" 
                    : "border-b border-transparent bg-background py-4"
                }`}
            >
                <div className="container mx-auto px-4">
                    <div className="relative flex items-center justify-between md:hidden">
                            <button
                                className="text-foreground transition-colors hover:text-primary"
                                aria-label="Menu"
                                onClick={() => setMobileMenuOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            <Link href="/" className="absolute left-1/2 -translate-x-1/2" onClick={() => setMobileMenuOpen(false)}>
                                <Logo className="h-12 w-auto" />
                            </Link>

                            <div className="flex items-center gap-4">
                                <Link href="/profile#wishlist" className="relative text-foreground transition-colors hover:text-primary" aria-label="Wishlist">
                                    <Heart className="h-5 w-5" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>

                                <button
                                    className="relative text-foreground transition-colors hover:text-primary"
                                    aria-label="Cart"
                                    onClick={() => setIsCartOpen(true)}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartCount > 0 && (
                                        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="hidden items-center justify-between gap-8 md:flex">
                            <Link href="/" className="shrink-0">
                                <Logo className="h-14 w-auto" />
                            </Link>

                            <nav className="hidden md:flex gap-10">
                                {navLinks.map(link => (
                                    <div 
                                        key={link.href}
                                        className="relative flex items-center h-full group py-5"
                                        onMouseEnter={() => {
                                            if (link.label === 'Shop' || link.label === 'Categories') {
                                                setActiveMegaMenu(link.label);
                                            } else {
                                                setActiveMegaMenu(null);
                                            }
                                        }}
                                    >
                                        <Link 
                                            href={link.href} 
                                            className={`text-[13px] uppercase tracking-[0.2em] font-bold transition-all duration-300 ${
                                                activeMegaMenu === link.label 
                                                ? "text-primary" 
                                                : "text-foreground/70 hover:text-primary"
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                        
                                        {/* Luxury Underline */}
                                        <span className={`absolute bottom-4 left-0 h-0.5 bg-primary transition-all duration-500 ${
                                            activeMegaMenu === link.label ? "w-full" : "w-0"
                                        }`} />
                                    </div>
                                ))}
                            </nav>

                            <div className="flex items-center gap-4 lg:gap-6">
                                {/* Global Pincode Selector */}
                                <div className="hidden lg:flex items-center gap-2 group cursor-pointer" onClick={() => {
                                    const code = prompt("Enter your delivery pincode", pincode);
                                    if (code !== null) setPincode(code.replace(/\D/g, "").slice(0, 6));
                                }}>
                                    <MapPin className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                    <div className="flex flex-col -space-y-1">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Deliver to</span>
                                        <span className="text-xs font-bold text-foreground">
                                            {pincode || "Select Area"}
                                        </span>
                                    </div>
                                </div>

                                <div className="relative hidden sm:flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Search jewelry..."
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        className="pl-9 pr-4 py-2 rounded-full border border-border bg-card text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48 lg:w-64 transition-all"
                                    />
                                    <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                                </div>

                                <button
                                    onClick={toggleTheme}
                                    aria-label={mounted && resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                                    aria-pressed={mounted && resolvedTheme === "dark"}
                                    title={mounted && resolvedTheme === "dark" ? "Dark mode enabled" : "Light mode enabled"}
                                    className={`relative h-6 w-12 overflow-hidden rounded-full border shadow-inner transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-primary/35 ${mounted && resolvedTheme === "dark"
                                        ? 'border-[#3d3a35] bg-[linear-gradient(90deg,#171717,#2a2927)]'
                                        : 'border-[#b8962e]/30 bg-[linear-gradient(90deg,#8cc3ef,#62ace6)]'
                                        }`}
                                >
                                    {mounted && (
                                        <>
                                            <span
                                                className={`absolute inset-0 transition-opacity duration-500 ${resolvedTheme === "dark" ? "opacity-0" : "opacity-100"}`}
                                                aria-hidden="true"
                                            >
                                                <span className="absolute -bottom-1 left-2.5 h-3 w-3 rounded-full bg-white/70" />
                                                <span className="absolute -bottom-1.5 left-4 h-4 w-4 rounded-full bg-white/75" />
                                                <span className="absolute -bottom-1 left-6.5 h-3 w-3 rounded-full bg-white/70" />
                                                <span className="absolute top-1.5 right-2.5 h-1.5 w-1.5 rounded-full bg-white/35" />
                                            </span>

                                            <span
                                                className={`absolute inset-0 transition-opacity duration-500 ${resolvedTheme === "dark" ? "opacity-100" : "opacity-0"}`}
                                                aria-hidden="true"
                                            >
                                                <span className="absolute left-2 top-1.5 h-1 w-1 rounded-full bg-white/90" />
                                                <span className="absolute left-4 top-3 h-1 w-1 rounded-full bg-white/80" />
                                                <span className="absolute left-7 top-2 h-0.5 w-0.5 rounded-full bg-white/75" />
                                                <span className="absolute left-8.5 top-3 h-1 w-1 rounded-full bg-white/70" />
                                            </span>

                                            <span
                                                className={`absolute top-0.5 z-10 h-5 w-5 rounded-full shadow-md transition-all duration-500 ${resolvedTheme === "dark"
                                                    ? 'left-[26px] bg-[#f0e4c3]'
                                                    : 'left-0.5 bg-primary'
                                                    }`}
                                            >
                                                <span className={`absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#d6c39a] transition-opacity duration-300 ${resolvedTheme === "dark" ? "opacity-100" : "opacity-0"}`} />
                                                <span className={`absolute right-1.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#d6c39a] transition-opacity duration-300 ${resolvedTheme === "dark" ? "opacity-100" : "opacity-0"}`} />
                                            </span>
                                        </>
                                    )}
                                </button>

                                <Link href="/profile#wishlist" className="relative text-foreground hover:text-primary transition-colors">
                                    <Heart className="w-5 h-5" />
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                                            {wishlistCount}
                                        </span>
                                    )}
                                </Link>

                                <button
                                    className="relative text-foreground hover:text-primary transition-colors"
                                    aria-label="Cart"
                                    onClick={() => setIsCartOpen(true)}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>

                                <div className="hidden sm:block min-w-0">
                                    {mounted && user ? (
                                        <div className="relative group">
                                            <button className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                            </button>
                                            <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                                                <div className="w-56 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden py-2">
                                                    <div className="px-4 py-3 border-b border-border mb-1">
                                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account</p>
                                                        <p className="text-sm font-semibold truncate text-foreground">{user.user_metadata?.full_name || user.email}</p>
                                                    </div>
                                                    
                                                    {dbUser?.role === 'ADMIN' && (
                                                        <>
                                                            <Link href="/admin" onClick={() => setActiveMegaMenu(null)} className="block px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5 transition-colors">
                                                                Admin Dashboard
                                                            </Link>
                                                            <div className="h-px bg-border my-1 mx-4" />
                                                        </>
                                                    )}

                                                    <Link href="/profile" onClick={() => setActiveMegaMenu(null)} className="block px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors">Your Profile</Link>
                                                    <Link href="/profile#orders" onClick={() => setActiveMegaMenu(null)} className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-primary transition-all">Order History</Link>
                                                    <div className="h-px bg-border my-1 mx-4" />
                                                    <button
                                                        onClick={() => {
                                                            setActiveMegaMenu(null);
                                                            signOut();
                                                        }}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                                                    >
                                                        Sign Out
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : mounted ? (
                                        <Link 
                                            href="/login" 
                                            className="px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#111827] bg-white border border-gray-100 rounded-full hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300 shadow-sm whitespace-nowrap"
                                        >
                                            Sign In
                                        </Link>
                                    ) : (
                                        <div className="w-[84px] h-[34px] bg-gray-50 rounded-full animate-pulse" />
                                    )}
                                </div>
                            </div>
                    </div>
                </div>
            </header>

            {/* Desktop Mega Menu Overlay */}
            <AnimatePresence>
                {activeMegaMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onMouseEnter={() => setActiveMegaMenu(activeMegaMenu)}
                        onMouseLeave={() => setActiveMegaMenu(null)}
                        className={`fixed inset-x-0 z-[45] hidden md:block transition-all duration-300 ${
                            isScrolled ? "top-[68px]" : "top-[86px]"
                        }`}
                    >
                        {/* Backdrop Blur Layer */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-black/10 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-b border-white/20 dark:border-white/5" />
                        
                        <div className="container relative mx-auto py-12 px-8">
                            <div className="grid grid-cols-4 gap-12">
                                {/* Collection Columns */}
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary">Collections</h4>
                                    <ul className="space-y-4">
                                        <li><Link href="/collections/all" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all flex items-center gap-2 group">Shop All Products <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span></Link></li>
                                        <li><Link href="/collections/all?isFeatured=true" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">Featured Masterpieces</Link></li>
                                        <li><Link href="/collections/all?sortBy=discount" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">Exquisite Offers</Link></li>
                                        <li><Link href="/collections/all?sortBy=rating" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">Customer Favorites</Link></li>
                                    </ul>
                                </div>

                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.25em] text-primary">Categories</h4>
                                    <ul className="space-y-4">
                                        <li><Link href="/collections/necklaces" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">Necklaces & Pendants</Link></li>
                                        <li><Link href="/collections/earrings" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">Earrings & Studs</Link></li>
                                        <li><Link href="/collections/bangles" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">Bangles & Bracelets</Link></li>
                                        <li><Link href="/collections/rings" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">Engagement Rings</Link></li>
                                        <li><Link href="/collections/sets" onClick={() => setActiveMegaMenu(null)} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-all">Complete Bridal Sets</Link></li>
                                    </ul>
                                </div>

                                {/* Promo Item 1 */}
                                <div className="col-span-2 grid grid-cols-2 gap-6">
                                    <Link 
                                        href="/collections/sets" 
                                        onClick={() => setActiveMegaMenu(null)}
                                        className="group relative aspect-[1.1] overflow-hidden rounded-2xl bg-gray-50 dark:bg-white/5 border border-white/20 dark:border-white/5"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">New In</p>
                                            <h5 className="text-sm font-bold text-white tracking-widest uppercase">The Bridal Edit</h5>
                                        </div>
                                        <div className="flex h-full w-full items-center justify-center p-8 transition-transform duration-700 group-hover:scale-110">
                                            <img src="/products/bridal-jewellery-set.png" alt="Bridal" className="object-contain max-h-full drop-shadow-2xl" />
                                        </div>
                                    </Link>

                                    <Link 
                                        href="/collections/earrings" 
                                        onClick={() => setActiveMegaMenu(null)}
                                        className="group relative aspect-[1.1] overflow-hidden rounded-2xl bg-gray-50 dark:bg-white/5 border border-white/20 dark:border-white/5"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">Trending</p>
                                            <h5 className="text-sm font-bold text-white tracking-widest uppercase">Diamond Studs</h5>
                                        </div>
                                        <div className="flex h-full w-full items-center justify-center p-8 transition-transform duration-700 group-hover:scale-110">
                                            <img src="/products/diamond-studs.png" alt="Earrings" className="object-contain max-h-full drop-shadow-2xl" />
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile-only small floating theme toggle */}
            <div className="fixed bottom-20 left-3 z-[60] md:hidden">
                <button
                    onClick={toggleTheme}
                    aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    className="h-10 w-10 rounded-full border border-border bg-card/95 dark:bg-slate-900/90 text-foreground shadow-xl transition-transform duration-150 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    {resolvedTheme === "dark" ? (
                        <Sun className="h-5 w-5 text-amber-300" />
                    ) : (
                        <Moon className="h-5 w-5 text-slate-700" />
                    )}
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[1500] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-[320px] animate-in slide-in-from-left flex-col border-r border-border bg-background shadow-2xl duration-300">
                        <div className="flex items-center justify-between border-b border-border px-6 py-5">
                            <Link href="/" className="" onClick={() => setMobileMenuOpen(false)}>
                                <Logo className="h-14 w-auto" />
                            </Link>
                            <button onClick={() => setMobileMenuOpen(false)} className="rounded-full p-2 transition-colors hover:bg-accent">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <nav className="flex-1 overflow-y-auto p-6 space-y-9">
                            {/* Pincode Selection (Mobile) */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-foreground px-0">Location</h3>
                                <button 
                                    onClick={() => {
                                        const code = prompt("Enter your delivery pincode", pincode);
                                        if (code !== null) setPincode(code.replace(/\D/g, "").slice(0, 6));
                                    }}
                                    className="flex items-center gap-3 w-full pl-4 py-3 bg-accent/30 rounded-2xl border border-border group"
                                >
                                    <MapPin className="h-5 w-5 text-primary" />
                                    <div className="flex flex-col items-start -space-y-0.5">
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Deliver to</span>
                                        <span className="text-base font-bold text-foreground">
                                            {pincode || "Select Pincode"}
                                        </span>
                                    </div>
                                </button>
                            </div>

                            {/* Auth Section (Mobile) */}
                            {user ? (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-medium text-foreground px-0">Account</h3>
                                    <div className="flex flex-col gap-3 pl-4 pt-1">
                                        {dbUser?.role === 'ADMIN' && (
                                            <Link 
                                                href="/admin"
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="text-[17px] font-bold text-primary hover:text-primary-dark transition-colors"
                                            >
                                                Admin Dashboard
                                            </Link>
                                        )}
                                        <Link 
                                            href="/profile"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-[17px] font-normal text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Your Profile
                                        </Link>
                                        <Link 
                                            href="/profile#orders"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-[17px] font-normal text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Order History
                                        </Link>
                                        <button 
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                signOut();
                                            }}
                                            className="text-[17px] font-medium text-red-500 hover:text-red-600 transition-colors text-left mt-2"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <Link 
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-[17px] font-bold text-primary hover:text-primary-dark transition-colors block"
                                    >
                                        Login / Create Account
                                    </Link>
                                </div>
                            )}

                            {/* Section 1: Shop */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-foreground px-0">Shop</h3>
                                <div className="flex flex-col gap-3 pl-4 pt-1">
                                    {[
                                        { label: "Jhumka Earrings", search: "Jhumka", category: "earrings" },
                                        { label: "Necklaces", category: "necklaces" },
                                        { label: "Earrings", category: "earrings" },
                                        { label: "Bangles", category: "bangles" }
                                    ].map((item) => (
                                        <button 
                                            key={item.label}
                                            onClick={() => {
                                                setActiveCategory(item.category || 'all');
                                                setSearchQuery(item.search || "");
                                                setMobileMenuOpen(false);
                                                router.push('/#products');
                                            }}
                                            className="text-[17px] font-normal text-muted-foreground hover:text-primary transition-colors text-left"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 3: New In */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-foreground px-0">New In</h3>
                                <div className="flex flex-col gap-3 pl-4 pt-1">
                                    <button 
                                        onClick={() => {
                                            setActiveCategory('all');
                                            setSearchQuery("");
                                            setMobileMenuOpen(false);
                                            router.push('/#products');
                                        }}
                                        className="text-[17px] font-normal text-muted-foreground hover:text-primary transition-colors text-left"
                                    >
                                        Recently Added
                                    </button>
                                </div>
                            </div>

                            {/* Section 4: Help */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-medium text-foreground px-0">Help & Guides</h3>
                                <div className="flex flex-col gap-3 pl-4 pt-1">
                                    {[
                                        { label: "Our Story", href: "/#our-story" },
                                        { label: "Size Guide", href: "/size-guide" },
                                        { label: "FAQ", href: "/#faq" },
                                        { label: "Customer Care", href: whatsappHref, external: true }
                                    ].map((item) => (
                                        item.external ? (
                                            <a 
                                                key={item.label}
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[17px] font-normal text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {item.label}
                                            </a>
                                        ) : (
                                            <Link 
                                                key={item.label}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className="text-[17px] font-normal text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                {item.label}
                                            </Link>
                                        )
                                    ))}
                                </div>
                            </div>
                        </nav>

                        {/* Support Footer */}
                        <div className="border-t border-border bg-muted/20 p-6">
                            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-green-500"><path d="M19.05 4.91A9.82 9.82 0 0 0 12.03 2C6.61 2 2.2 6.41 2.2 11.83c0 1.73.45 3.43 1.3 4.93L2 22l5.39-1.41a9.8 9.8 0 0 0 4.64 1.18h.01c5.42 0 9.83-4.41 9.83-9.83 0-2.63-1.03-5.1-2.82-7.03Zm-7.02 15.2h-.01a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3.2.84.86-3.12-.2-.32a8.15 8.15 0 0 1-1.25-4.36c0-4.5 3.66-8.16 8.17-8.16 2.18 0 4.22.85 5.76 2.39a8.1 8.1 0 0 1 2.39 5.77c0 4.5-3.66 8.16-8.16 8.16Zm4.48-6.12c-.25-.13-1.47-.72-1.7-.8-.23-.08-.39-.13-.56.12-.17.25-.64.8-.79.97-.15.17-.29.19-.54.06-.25-.13-1.04-.38-1.98-1.22a7.39 7.39 0 0 1-1.37-1.7c-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.56-1.35-.77-1.84-.2-.48-.41-.41-.56-.42h-.48c-.17 0-.45.06-.68.32-.23.25-.87.85-.87 2.08 0 1.22.89 2.4 1.01 2.57.13.17 1.76 2.69 4.27 3.77.6.26 1.07.42 1.44.53.6.19 1.14.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29Z" /></svg>
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-bold tracking-widest leading-none mb-1">Support</div>
                                    <div className="text-sm font-bold text-foreground">+91 93269 01595</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

