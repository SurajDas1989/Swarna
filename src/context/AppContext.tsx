"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from './AuthContext';

export interface Product {
    id: string;
    name: string;
    category: string | { slug?: string; name?: string; id?: string };
    price: number;
    compareAtPrice?: number | null;
    costPerItem?: number | null;
    chargeTax?: boolean;
    originalPrice: number;
    rating: number;
    image: string;
    images?: string[];
    description: string;
    stock?: number;
    isActive?: boolean;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface OrderDetails {
    orderId: string;
    paymentId?: string;
    paymentMethod?: string;
    items: CartItem[];
    total: number;
    mrpTotal?: number;
    discountOnMRP?: number;
    couponDiscount?: number;
    storeCreditUsed?: number;
    shipping: number;
    finalTotal: number;
    billingInfo: {
        firstName: string;
        lastName: string;
        email: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
    }
}

interface AppContextType {
    wishlist: string[];
    addToWishlist: (productId: string) => void;
    removeFromWishlist: (productId: string) => void;
    toggleWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    wishlistCount: number;

    // Cart functionality
    cart: CartItem[];
    addToCart: (productId: string) => Promise<boolean>;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    cartMRP: number;
    cartDiscount: number;
    deliveryCharge: number;
    cartFinalTotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;

    // Coupon state
    couponApplied: boolean;
    appliedCouponCode: string;
    couponDiscount: number;
    couponMaxDiscount: number | null;
    couponDiscountAmount: number;
    applyCoupon: (code: string) => Promise<{ valid: boolean; error?: string }>;
    removeCoupon: () => void;
    // Category state for filtering from Homepage Category Grid
    activeCategory: string;
    setActiveCategory: (category: string) => void;

    // Price range filtering
    activePriceRange: string;
    setActivePriceRange: (range: string) => void;


    // Search state
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Order state
    recentOrder: OrderDetails | null;
    placeOrder: (details: OrderDetails) => void;

    // Prepaid Discount
    prepaidDiscountAmount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function getCategoryLabel(category: Product["category"]) {
    if (typeof category === "string") return category;
    return category?.slug || category?.name || "";
}

function normalizeProduct(product: Product): Product {
    return {
        ...product,
        category: getCategoryLabel(product.category),
        stock: typeof product.stock === "number" ? product.stock : 0,
    };
}

function normalizeCartItems(items: CartItem[]) {
    return items.map((item) => ({
        ...item,
        category: getCategoryLabel(item.category),
        stock: typeof item.stock === "number" ? item.stock : 0,
    }));
}

function mergeCartItems(items: CartItem[]) {
    const merged = new Map<string, CartItem>();

    for (const item of items) {
        const normalized = {
            ...item,
            category: getCategoryLabel(item.category),
            stock: typeof item.stock === "number" ? item.stock : 0,
        };
        const existing = merged.get(normalized.id);

        if (!existing) {
            merged.set(normalized.id, normalized);
            continue;
        }

        merged.set(normalized.id, {
            ...existing,
            ...normalized,
            quantity: existing.quantity + normalized.quantity,
            stock: Math.max(existing.stock ?? 0, normalized.stock ?? 0),
        });
    }

    return Array.from(merged.values());
}


export function AppProvider({ children }: { children: React.ReactNode }) {
    // Load from localStorage if available, otherwise empty array
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [hasHydratedCart, setHasHydratedCart] = useState(false);
    const [hasLoadedServerCart, setHasLoadedServerCart] = useState(false);
    const lastSyncedCartRef = useRef<string>("");

    // Auth context for syncing
    const { user } = useAuth();

    // Global category filter state
    const [activeCategory, setActiveCategory] = useState<string>('all');

    // Global price range filter state
    const [activePriceRange, setActivePriceRange] = useState<string>('all');


    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    // Order state
    const [recentOrder, setRecentOrder] = useState<OrderDetails | null>(null);

    // Coupon state
    const [couponApplied, setCouponApplied] = useState(false);
    const [appliedCouponCode, setAppliedCouponCode] = useState("");
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponMaxDiscount, setCouponMaxDiscount] = useState<number | null>(null);

    // Load initial state from localStorage
    useEffect(() => {
        const savedWishlist = localStorage.getItem('jewelluxe_wishlist');
        if (savedWishlist) {
            try {
                setWishlist(JSON.parse(savedWishlist));
            } catch (e) {
                console.error("Failed to parse wishlist from local storage");
            }
        }

        const savedCart = localStorage.getItem('jewelluxe_cart');
        if (savedCart) {
            try {
                setCart(mergeCartItems(normalizeCartItems(JSON.parse(savedCart))));
            } catch (e) {
                console.error("Failed to parse cart from local storage");
            }
        }
        setHasHydratedCart(true);

        const savedCoupon = localStorage.getItem('jewelluxe_coupon');
        if (savedCoupon) {
            try {
                const { applied, code, discount, maxDiscount } = JSON.parse(savedCoupon);
                setCouponApplied(applied);
                setAppliedCouponCode(code);
                setCouponDiscount(discount);
                setCouponMaxDiscount(maxDiscount);
            } catch (e) {
                console.error("Failed to parse coupon from local storage");
            }
        }
    }, []);

    // Fetch database wishlist when user logs in
    useEffect(() => {
        if (!user) return; // Wait until they are logged in

        const fetchDatabaseWishlist = async () => {
            try {
                const res = await fetch('/api/wishlist');
                if (res.ok) {
                    const dbWishlist = await res.json();

                    // Merge local and DB wishlists smartly
                    setWishlist(prevLocal => {
                        const merged = new Set([...prevLocal, ...dbWishlist]);
                        const finalArray = Array.from(merged);

                        // If we had local items that weren't in the DB, sync them UP to the server in the background
                        const newLocalItems = prevLocal.filter(id => !dbWishlist.includes(id));
                        newLocalItems.forEach(id => {
                            fetch('/api/wishlist', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ productId: id })
                            }).catch(console.error);
                        });

                        return finalArray;
                    });
                }
            } catch (error) {
                console.error("Failed to sync wishlist with database", error);
            }
        };

        fetchDatabaseWishlist();
    }, [user]);

    // Fetch database cart when user logs in
    useEffect(() => {
        if (!user) {
            setHasLoadedServerCart(false);
            return;
        }
        if (!hasHydratedCart) return;

        const fetchDatabaseCart = async () => {
            try {
                const res = await fetch('/api/cart');
                if (res.ok) {
                    const dbCart = await res.json();
                    setCart(prev => mergeCartItems([
                        ...normalizeCartItems(Array.isArray(dbCart) ? dbCart : []),
                        ...prev,
                    ]));
                }
            } catch (error) {
                console.error("Failed to sync cart with database", error);
            } finally {
                setHasLoadedServerCart(true);
            }
        };

        fetchDatabaseCart();
    }, [user, hasHydratedCart]);

    // Save to localStorage whenever wishlist changes
    useEffect(() => {
        localStorage.setItem('jewelluxe_wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    // Normalize wishlist against existing products so badge/list stay in sync.
    useEffect(() => {
        if (wishlist.length === 0) return;

        let cancelled = false;

        const normalizeWishlist = async () => {
            try {
                const params = new URLSearchParams();
                params.set('ids', wishlist.join(','));

                const res = await fetch(`/api/products/by-ids?${params.toString()}`, { cache: 'no-store' });
                if (!res.ok) return;

                const data = await res.json();
                if (!Array.isArray(data)) return;

                const validIds = new Set(data.map((p: Product) => p.id));
                const normalized = wishlist.filter((id) => validIds.has(id));
                const changed = normalized.length !== wishlist.length || normalized.some((id, i) => id !== wishlist[i]);

                if (!changed || cancelled) return;

                const staleIds = wishlist.filter((id) => !validIds.has(id));
                setWishlist(normalized);

                if (user && staleIds.length > 0) {
                    staleIds.forEach((productId) => {
                        fetch('/api/wishlist', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ productId })
                        }).catch(console.error);
                    });
                }
            } catch (error) {
                console.error('Failed to normalize wishlist', error);
            }
        };

        normalizeWishlist();

        return () => {
            cancelled = true;
        };
    }, [wishlist, user]);
    // Save to localStorage AND Sync to Database whenever cart changes
    useEffect(() => {
        localStorage.setItem('jewelluxe_cart', JSON.stringify(cart));

        if (user && hasLoadedServerCart) {
            const serializedCart = JSON.stringify(cart.map(({ id, quantity }) => ({ id, quantity })));
            if (lastSyncedCartRef.current === serializedCart) {
                return;
            }
            lastSyncedCartRef.current = serializedCart;
            fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: cart })
            }).catch(console.error);
        }
    }, [cart, user, hasLoadedServerCart]);

    // Save coupon to localStorage
    useEffect(() => {
        localStorage.setItem('jewelluxe_coupon', JSON.stringify({
            applied: couponApplied,
            code: appliedCouponCode,
            discount: couponDiscount,
            maxDiscount: couponMaxDiscount
        }));
    }, [couponApplied, appliedCouponCode, couponDiscount, couponMaxDiscount]);



    const addToWishlist = async (productId: string) => {
        setWishlist(prev => {
            if (!prev.includes(productId)) return [...prev, productId];
            return prev;
        });

        if (user) {
            fetch('/api/wishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            }).catch(console.error);
        }
    };

    const removeFromWishlist = async (productId: string) => {
        setWishlist(prev => prev.filter(id => id !== productId));

        if (user) {
            fetch('/api/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            }).catch(console.error);
        }
    };

    const toggleWishlist = (productId: string) => {
        const isCurrentlyInWishlist = wishlist.includes(productId);

        if (isCurrentlyInWishlist) {
            removeFromWishlist(productId);
        } else {
            addToWishlist(productId);
        }
    };

    const isInWishlist = (productId: string) => {
        return wishlist.includes(productId);
    };

    // Cart Methods
    const addToCart = async (productId: string): Promise<boolean> => {
        setIsCartOpen(true); // Auto open cart when adding

        let shouldFetchProduct = false;

        setCart(prev => {
            const mergedPrev = mergeCartItems(prev);
            const existingItem = mergedPrev.find(item => item.id === productId);
            const availableStock = Math.max(0, existingItem?.stock ?? 0);

            if (!existingItem) {
                shouldFetchProduct = true;
                return mergedPrev;
            }

            if (availableStock <= 0) {
                return mergedPrev;
            }

            return mergedPrev.map(item =>
                item.id === productId
                    ? { ...item, quantity: Math.min(item.quantity + 1, availableStock), stock: availableStock }
                    : item
            );
        });

        // Item was already in cart — bumped quantity synchronously, toast can fire
        if (!shouldFetchProduct) {
            return true;
        }

        // Item is new — we need to fetch it first. Toast must wait.
        try {
            const res = await fetch(`/api/products/${productId}`, { cache: 'no-store' });
            if (!res.ok) {
                console.error(`Failed to fetch product ${productId}: HTTP ${res.status}`);
                return false;
            }

            const data = await res.json();
            const product = normalizeProduct(data as Product);
            const availableStock = Math.max(0, product.stock ?? 0);

            if (availableStock <= 0) return false;

            setCart((prev) => {
                const mergedPrev = mergeCartItems(prev);
                const existingItem = mergedPrev.find((item) => item.id === productId);

                if (existingItem) {
                    return mergedPrev.map((item) =>
                        item.id === productId
                            ? { ...item, stock: availableStock, quantity: Math.min(item.quantity + 1, availableStock) }
                            : item
                    );
                }

                return [...mergedPrev, { ...product, stock: availableStock, quantity: 1 }];
            });

            return true;
        } catch (error) {
            console.error('Failed to fetch product for cart', error);
            return false;
        }
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateCartQuantity = (productId: string, quantity: number) => {
        setCart(prev => {
            if (quantity <= 0) {
                return prev.filter(item => item.id !== productId);
            }
            return prev.map(item =>
                item.id === productId
                    ? { ...item, quantity: Math.min(quantity, Math.max(1, item.stock ?? quantity)) }
                    : item
            );
        });
    };

    const clearCart = () => {
        setCart([]);
        if (user) {
            fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: [] })
            }).catch(console.error);
        }
    };

    const placeOrder = (details: OrderDetails) => {
        setRecentOrder(details);
        clearCart();
        removeCoupon(); // Clear coupon after order
    };

    const applyCoupon = async (code: string) => {
        const trimmedCode = code.trim().toUpperCase();
        if (!trimmedCode) return { valid: false, error: "Please enter a coupon code." };

        // Skip if already applied
        if (couponApplied && appliedCouponCode === trimmedCode) {
            return { valid: true };
        }

        try {
            const res = await fetch("/api/discount/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: trimmedCode }),
            });
            const data = await res.json();
            if (data.valid) {
                setCouponApplied(true);
                setAppliedCouponCode(trimmedCode);
                setCouponDiscount(data.discountPercent);
                setCouponMaxDiscount(data.maxDiscountAmount);
                return { valid: true };
            } else {
                return { valid: false, error: data.error || "Invalid coupon code." };
            }
        } catch (error) {
            return { valid: false, error: "Failed to validate coupon." };
        }
    };

    const removeCoupon = () => {
        setCouponApplied(false);
        setAppliedCouponCode("");
        setCouponDiscount(0);
        setCouponMaxDiscount(null);
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const cartMRP = cart.reduce((total, item) => total + ((item.originalPrice || item.price) * item.quantity), 0);
    const cartDiscount = cartMRP - cartTotal;
    
    const couponDiscountAmount = couponApplied
        ? couponMaxDiscount !== null
            ? Math.min(cartTotal * (couponDiscount / 100), couponMaxDiscount)
            : cartTotal * (couponDiscount / 100)
        : 0;

    const deliveryCharge = cartTotal > 0 && cartTotal < 799 ? 99 : 0;
    
    // Prepaid Discount is 5% of cartTotal (after MRP discount, before coupon?)
    // User logic: cartTotal is the subtotal after MRP discount.
    // We'll calculate it on cartTotal.
    const prepaidDiscountAmount = Math.round(cartTotal * 0.05);
    
    const cartFinalTotal = cartTotal - Math.round(couponDiscountAmount) + deliveryCharge;

    return (
        <AppContext.Provider
            value={{
                wishlist,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
                isInWishlist,
                wishlistCount: wishlist.length,

                cart,
                addToCart,
                removeFromCart,
                updateCartQuantity,
                clearCart,
                cartCount,
                cartTotal,
                cartMRP,
                cartDiscount,
                deliveryCharge,
                cartFinalTotal,
                isCartOpen,
                setIsCartOpen,

                couponApplied,
                appliedCouponCode,
                couponDiscount,
                couponMaxDiscount,
                couponDiscountAmount,
                applyCoupon,
                removeCoupon,

                activeCategory,
                setActiveCategory,

                activePriceRange,
                setActivePriceRange,


                searchQuery,
                setSearchQuery,

                recentOrder,
                placeOrder,

                prepaidDiscountAmount
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useAppContext must be used within an AppProvider");
    }
    return context;
}










