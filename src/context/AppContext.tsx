"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from './AuthContext';

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice: number;
    rating: number;
    image: string;
    description: string;
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
    addToCart: (productId: string) => void;
    removeFromCart: (productId: string) => void;
    updateCartQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    deliveryCharge: number;
    cartFinalTotal: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    // Category state for filtering from Homepage Category Grid
    activeCategory: string;
    setActiveCategory: (category: string) => void;


    // Search state
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Products State
    products: Product[];
    isProductsLoading: boolean;

    // Order state
    recentOrder: OrderDetails | null;
    placeOrder: (details: OrderDetails) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    // Load from localStorage if available, otherwise empty array
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Auth context for syncing
    const { user } = useAuth();

    // Global category filter state
    const [activeCategory, setActiveCategory] = useState<string>('all');


    // Search state
    const [searchQuery, setSearchQuery] = useState("");

    // Products state
    const [products, setProducts] = useState<Product[]>([]);
    const [isProductsLoading, setIsProductsLoading] = useState(true);

    // Order state
    const [recentOrder, setRecentOrder] = useState<OrderDetails | null>(null);

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
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from local storage");
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
        if (!user) return; // Wait until they are logged in

        const fetchDatabaseCart = async () => {
            try {
                const res = await fetch('/api/cart');
                if (res.ok) {
                    const dbCart = await res.json();
                    if (Array.isArray(dbCart) && dbCart.length > 0) {
                        setCart(dbCart);
                    }
                }
            } catch (error) {
                console.error("Failed to sync cart with database", error);
            }
        };

        fetchDatabaseCart();
    }, [user]);

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

                const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
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

        if (user) {
            // Only sync to DB if the cart wasn't just fetched
            fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cartItems: cart })
            }).catch(console.error);
        }
    }, [cart, user]);

    // Fetch Products dynamically based on filters
    useEffect(() => {
        const fetchProducts = async () => {
            setIsProductsLoading(true);
            try {
                const params = new URLSearchParams();
                if (activeCategory !== 'all') params.append('category', activeCategory);
                if (searchQuery) params.append('search', searchQuery);
                

                const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' });
                if (!res.ok) {
                    throw new Error(`Products API returned ${res.status}`);
                }

                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch products", err);
                setProducts([]);
            } finally {
                setIsProductsLoading(false);
            }
        };

        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchProducts();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [activeCategory, searchQuery]);

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
    const addToCart = (productId: string) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.id === productId);
            if (existingItem) {
                return prev.map(item =>
                    item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }

            const product = products.find(p => p.id === productId);
            if (product) {
                return [...prev, { ...product, quantity: 1 }];
            }

            return prev;
        });
        setIsCartOpen(true); // Auto open cart when adding
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
                item.id === productId ? { ...item, quantity } : item
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
    };

    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const deliveryCharge = cartTotal > 0 && cartTotal < 799 ? 99 : 0;
    const cartFinalTotal = cartTotal + deliveryCharge;

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
                deliveryCharge,
                cartFinalTotal,
                isCartOpen,
                setIsCartOpen,

                activeCategory,
                setActiveCategory,


                searchQuery,
                setSearchQuery,

                products,
                isProductsLoading,

                recentOrder,
                placeOrder
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










