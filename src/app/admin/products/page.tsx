"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Edit, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductFormModal from "../components/ProductFormModal";

interface Product {
    id: string;
    name: string;
    category: {
        name: string;
    };
    price: number;
    compareAtPrice?: number | null;
    costPerItem?: number | null;
    chargeTax?: boolean;
    stock: number;
    outOfStockSince?: string | null;
    images: string[];
    description: string;
    isActive: boolean;
    isFeatured: boolean;
    categoryId: string;
    sku?: string | null;
}

export default function AdminProductsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    const getOutOfStockAgeInDays = (outOfStockSince?: string | null) => {
        if (!outOfStockSince) return null;

        const startedAt = new Date(outOfStockSince);
        if (Number.isNaN(startedAt.getTime())) return null;

        const diffMs = Date.now() - startedAt.getTime();
        return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login?redirect=/admin/products');
        }
    }, [user, loading, router]);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/products?includeInactive=true', { cache: 'no-store' });
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
                alert('Product deleted successfully');
            } else {
                const error = await res.json().catch(() => null);
                alert(error?.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while deleting');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleToggleStatus = async (product: Product) => {
        setUpdatingStatus(product.id);
        try {
            const res = await fetch('/api/admin/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: product.id,
                    isActive: !product.isActive,
                }),
            });

            if (res.ok) {
                setProducts(prev =>
                    prev.map(p =>
                        p.id === product.id ? { ...p, isActive: !p.isActive } : p
                    )
                );
            } else {
                alert('Failed to update product status');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while updating status');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleOpenForm = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    const handleFormSuccess = () => {
        fetchProducts();
    };

    if (loading || isLoading) {
        return (
            <div className="flex bg-gray-50 dark:bg-background min-h-[50vh] items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    const cleanupCandidates = products.filter((product) => {
        const ageInDays = getOutOfStockAgeInDays(product.outOfStockSince);
        return product.stock <= 0 && ageInDays !== null && ageInDays >= 180;
    }).length;

    return (
        <>
            <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Products</h1>
                        <p className="text-sm text-gray-500">Manage your store's inventory</p>
                    </div>
                    <Button 
                        onClick={() => handleOpenForm()}
                        className="bg-primary hover:bg-primary/90 text-white gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Product
                    </Button>
                </div>

                {cleanupCandidates > 0 ? (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        {cleanupCandidates} product{cleanupCandidates === 1 ? '' : 's'} have been out of stock for more than 6 months. Review them as cleanup candidates before deleting anything with order history.
                    </div>
                ) : null}

                <div className="bg-white dark:bg-card rounded-xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/10 text-sm">
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Product</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Price</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Stock</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No products found. Add one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => {
                                        const outOfStockAgeInDays = getOutOfStockAgeInDays(product.outOfStockSince);
                                        const isCleanupCandidate = product.stock <= 0 && outOfStockAgeInDays !== null && outOfStockAgeInDays >= 180;

                                        return (
                                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="p-4 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden relative shrink-0 border border-gray-100 dark:border-white/10">
                                                    <Image
                                                        src={product.images?.[0] || '/placeholder.jpg'}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="48px"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/placeholder.jpg';
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground text-sm line-clamp-1">{product.name}</p>
                                                    {product.sku ? (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-mono mt-0.5">{product.sku}</p>
                                                    ) : (
                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {product.id.slice(0, 8)}...</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium capitalize">
                                                    {product.category?.name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-semibold text-primary">
                                                <div className="flex flex-col">
                                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.price)}</span>
                                                    {product.compareAtPrice && product.compareAtPrice > product.price ? (
                                                        <span className="text-xs font-normal text-gray-400 line-through">
                                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.compareAtPrice)}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`w-fit px-3 py-1 rounded-lg text-xs font-semibold ${
                                                        product.stock > 10
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                            : product.stock > 0
                                                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                    }`}>
                                                        {product.stock}
                                                    </span>
                                                    {product.stock <= 0 && outOfStockAgeInDays !== null ? (
                                                        <span className={`text-xs ${isCleanupCandidate ? 'font-semibold text-amber-700 dark:text-amber-300' : 'text-gray-500'}`}>
                                                            {isCleanupCandidate
                                                                ? `Out of stock for ${outOfStockAgeInDays} days`
                                                                : `Zero stock for ${outOfStockAgeInDays} days`}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`w-fit px-2.5 py-1 rounded-lg text-xs font-medium ${
                                                        product.isActive
                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                        {product.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                    {isCleanupCandidate ? (
                                                        <span className="w-fit rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                                            Cleanup candidate
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(product)}
                                                        disabled={updatingStatus === product.id}
                                                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg disabled:opacity-50"
                                                        title={product.isActive ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {updatingStatus === product.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : product.isActive ? (
                                                            <Eye className="w-4 h-4" />
                                                        ) : (
                                                            <EyeOff className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenForm(product)}
                                                        className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id)}
                                                        disabled={isDeleting === product.id}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50"
                                                    >
                                                        {isDeleting === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ProductFormModal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSuccess={handleFormSuccess}
                product={editingProduct}
            />
        </>
    );
}

