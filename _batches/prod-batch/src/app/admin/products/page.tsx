"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stock?: number;
    image: string;
    description: string;
}

export default function AdminProductsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?redirect=/admin/products');
        }
    }, [user, loading, router]);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setProducts(Array.isArray(data) ? data : []);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error(error);
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProducts();
        }
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        setIsDeleting(id);
        try {
            const res = await fetch(`/api/admin/products?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id));
            } else {
                alert('Failed to delete product');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while deleting');
        } finally {
            setIsDeleting(null);
        }
    };

    if (loading || isLoading) {
        return (
            <div className="flex bg-gray-50 dark:bg-background min-h-[50vh] items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Products</h1>
                    <p className="text-sm text-gray-500">Manage your store's inventory</p>
                </div>
                <Button className="bg-primary hover:bg-primary-dark text-white gap-2">
                    <Plus className="w-4 h-4" /> Add Product
                </Button>
            </div>

            <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-sm">
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Product</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Price</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No products found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-4 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden relative shrink-0 border border-gray-100 dark:border-white/10">
                                                <Image
                                                    src={product.image}
                                                    alt={product.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground text-sm line-clamp-1">{product.name}</p>
                                                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {product.id.slice(0, 8)}...</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium capitalize">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-primary">
                                            INR {product.price.toLocaleString('en-IN')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    disabled={isDeleting === product.id}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                >
                                                    {isDeleting === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

