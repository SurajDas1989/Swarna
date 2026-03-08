"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Menu, X, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Navbar() {
    const router = useRouter();
    const { wishlistCount, cartCount, setIsCartOpen, searchQuery, setSearchQuery } = useAppContext();
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        { href: '/#about', label: 'About' },
        { href: '/#contact', label: 'Contact' },
    ];

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white shadow-sm dark:bg-[#1e1e1e]">
                <div className="overflow-hidden border-b border-foreground/20 bg-foreground py-2 text-sm text-white dark:border-white/10 dark:bg-[#111]">
                    <div className="container relative mx-auto flex items-center justify-between px-4">
                        <div className="flex w-full items-center overflow-hidden whitespace-nowrap">
                            <div className="inline-block animate-[marquee_20s_linear_infinite] font-medium tracking-wide">
                                ✨ Free Shipping on Orders Above ₹799 • Discover the Premium Wedding Collection
                            </div>
                        </div>
                        <div className="relative z-10 hidden shrink-0 bg-foreground pl-6 font-medium dark:bg-[#111] sm:block">📞 Call: +91 93269 01595</div>
                    </div>
                </div>

                <div className="py-4">
                    <div className="container mx-auto px-4">
                        <div className="relative flex items-center justify-between md:hidden">
                            <button
                                className="text-foreground transition-colors hover:text-primary"
                                aria-label="Menu"
                                onClick={() => setMobileMenuOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            <Link href="/" className="absolute left-1/2 flex -translate-x-1/2 items-baseline gap-0.5">
                                <span className="text-4xl font-bold italic text-primary" style={{ fontFamily: 'Georgia, serif', lineHeight: 1 }}>S</span>
                                <span className="text-base font-bold uppercase tracking-[0.3em] text-primary">WARNA</span>
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
                            <Link href="/" className="shrink-0 flex items-baseline gap-0.5">
                                <span className="text-4xl font-bold italic text-primary" style={{ fontFamily: 'Georgia, serif', lineHeight: 1 }}>S</span>
                                <span className="text-base font-bold tracking-[0.3em] text-primary uppercase">WARNA</span>
                            </Link>

                            <nav className="hidden md:flex gap-8">
                                {navLinks.map(link => (
                                    <Link key={link.href} href={link.href} className="text-foreground font-medium hover:text-primary transition-colors">
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>

                            <div className="flex items-center gap-4 lg:gap-6">
                                <div className="relative hidden sm:flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Search jewelry..."
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        className="pl-9 pr-4 py-2 rounded-full border border-gray-200 dark:border-white/15 dark:bg-white/5 dark:text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48 lg:w-64 transition-all"
                                    />
                                    <Search className="w-4 h-4 absolute left-3 text-gray-400" />
                                </div>

                                <button
                                    onClick={toggleTheme}
                                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                    aria-pressed={theme === 'dark'}
                                    className={`relative h-6 w-12 overflow-hidden rounded-full border shadow-inner transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-primary/35 ${
                                        theme === 'dark'
                                            ? 'border-[#3d3a35] bg-[linear-gradient(90deg,#171717,#2a2927)]'
                                            : 'border-[#b8962e]/30 bg-[linear-gradient(90deg,#8cc3ef,#62ace6)]'
                                    }`}
                                >
                                    <span
                                        className={`absolute inset-0 transition-opacity duration-500 ${theme === 'dark' ? 'opacity-0' : 'opacity-100'}`}
                                        aria-hidden="true"
                                    >
                                        <span className="absolute -bottom-1 left-2.5 h-3 w-3 rounded-full bg-white/70" />
                                        <span className="absolute -bottom-1.5 left-4 h-4 w-4 rounded-full bg-white/75" />
                                        <span className="absolute -bottom-1 left-6.5 h-3 w-3 rounded-full bg-white/70" />
                                        <span className="absolute top-1.5 right-2.5 h-1.5 w-1.5 rounded-full bg-white/35" />
                                    </span>

                                    <span
                                        className={`absolute inset-0 transition-opacity duration-500 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}
                                        aria-hidden="true"
                                    >
                                        <span className="absolute left-2 top-1.5 h-1 w-1 rounded-full bg-white/90" />
                                        <span className="absolute left-4 top-3 h-1 w-1 rounded-full bg-white/80" />
                                        <span className="absolute left-7 top-2 h-0.5 w-0.5 rounded-full bg-white/75" />
                                        <span className="absolute left-8.5 top-3 h-1 w-1 rounded-full bg-white/70" />
                                    </span>

                                    <span
                                        className={`absolute top-0.5 z-10 h-5 w-5 rounded-full shadow-md transition-all duration-500 ${
                                            theme === 'dark'
                                                ? 'left-[26px] bg-[#f0e4c3]'
                                                : 'left-0.5 bg-primary'
                                        }`}
                                    >
                                        <span className={`absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#d6c39a] transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
                                        <span className={`absolute right-1.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#d6c39a] transition-opacity duration-300 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
                                    </span>
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

                                <div className="hidden sm:block">
                                    {user ? (
                                        <div className="relative group">
                                            <button className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden">
                                                    <User className="w-5 h-5 text-primary" />
                                                </div>
                                            </button>
                                            <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                                                <div className="w-56 bg-white dark:bg-[#242424] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden py-2">
                                                    <div className="px-4 py-3 border-b dark:border-white/10 mb-1">
                                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account</p>
                                                        <p className="text-sm font-semibold truncate text-foreground">{user.user_metadata?.full_name || user.email}</p>
                                                    </div>
                                                    <Link href="/profile" className="block px-4 py-2.5 text-sm text-foreground hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">Your Profile</Link>
                                                    <Link href="/profile#orders" className="block px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-primary transition-all">Order History</Link>
                                                    <div className="h-px bg-gray-100 dark:bg-white/10 my-1 mx-4" />
                                                    <button
                                                        onClick={() => signOut()}
                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
                                                    >
                                                        Logout
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Link href="/login">
                                            <Button variant="outline" className="rounded-full px-6 border-primary/30 text-primary hover:bg-primary/5 uppercase text-xs font-bold tracking-widest h-10 transition-all active:scale-95 shadow-sm">
                                                Login
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[1500] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-[320px] animate-in slide-in-from-left flex-col bg-white shadow-2xl duration-300 dark:bg-[#1e1e1e]">
                        <div className="flex items-center justify-between border-b p-6">
                            <Link href="/" className="flex items-baseline gap-0.5" onClick={() => setMobileMenuOpen(false)}>
                                <span className="text-3xl font-bold italic text-primary" style={{ fontFamily: 'Georgia, serif', lineHeight: 1 }}>S</span>
                                <span className="text-sm font-bold tracking-[0.3em] text-primary uppercase">WARNA</span>
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-full p-2 transition-colors hover:bg-gray-100"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="border-b p-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search jewelry..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        handleSearch(e);
                                        if (e.target.value.length > 0) {
                                            setMobileMenuOpen(false);
                                        }
                                    }}
                                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/15 dark:bg-white/5 dark:text-foreground"
                                />
                                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <nav className="flex-1 overflow-y-auto p-4">
                            {!user && (
                                <div className="mb-6 grid grid-cols-2 gap-3">
                                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                                        <Button className="h-12 w-full rounded-xl bg-gray-900 text-white shadow-md transition-transform active:scale-95">Login</Button>
                                    </Link>
                                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block">
                                        <Button variant="outline" className="h-12 w-full rounded-xl border-primary/20 text-primary transition-transform active:scale-95">Sign Up</Button>
                                    </Link>
                                </div>
                            )}

                            <div className="space-y-1">
                                {navLinks.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block rounded-xl px-4 py-3.5 font-medium text-foreground transition-all hover:bg-primary/5 hover:text-primary"
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>

                            <div className="mt-6 space-y-1 border-t pt-6">
                                {user && (
                                    <>
                                        <Link
                                            href="/profile"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-4 py-3.5 font-medium transition-all hover:bg-primary/5 hover:text-primary"
                                        >
                                            <User className="h-5 w-5" />
                                            My Profile
                                        </Link>
                                        <Link
                                            href="/profile#orders"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center gap-3 rounded-xl px-4 py-3.5 font-medium transition-all hover:bg-primary/5 hover:text-primary"
                                        >
                                            <ShoppingCart className="h-5 w-5" />
                                            Order History
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>

                        <div className="border-t bg-gray-50 p-4">
                            {user ? (
                                <button
                                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                                    className="w-full flex items-center justify-center gap-2 py-4 text-red-500 font-bold hover:bg-red-50 transition-colors uppercase text-xs tracking-widest"
                                >
                                    Logout Account
                                </button>
                            ) : (
                                <p className="text-center text-xs text-gray-500">📞 +91 93269 01595</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
