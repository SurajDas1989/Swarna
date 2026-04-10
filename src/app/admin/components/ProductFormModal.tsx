"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Upload, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import {
    PRODUCT_TYPE_PREFIXES,
    COLOR_CODES,
    getTypePrefix,
    getColorCode,
    getPriceTierCode,
    buildSku,
} from "@/lib/skuGenerator";

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: {
        id: string;
        name: string;
        description: string;
        story?: string | null;
        highlights?: string[];
        price: number;
        compareAtPrice?: number | null;
        costPerItem?: number | null;
        chargeTax?: boolean;
        stock: number;
        categoryId: string;
        images: string[];
        isActive: boolean;
        isFeatured: boolean;
        sku?: string | null;
    } | null;
}

interface Category {
    id: string;
    name: string;
}

const MAX_UPLOAD_BYTES = 250 * 1024;
const MAX_DIMENSION = 1600;

function sanitizeFileName(name: string) {
    return name
        .toLowerCase()
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 50) || "product-image";
}

async function loadImage(file: File) {
    const objectUrl = URL.createObjectURL(file);

    try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = objectUrl;
        });

        return image;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", quality);
    });

    if (!blob) {
        throw new Error("Failed to compress image");
    }

    return blob;
}

async function compressImage(file: File) {
    const image = await loadImage(file);
    const ratio = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));

    let width = Math.max(1, Math.round(image.width * ratio));
    let height = Math.max(1, Math.round(image.height * ratio));
    let quality = 0.9;

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Canvas is not available in this browser");
    }

    let bestBlob: Blob | null = null;

    for (let resizeStep = 0; resizeStep < 5; resizeStep += 1) {
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        quality = 0.9;
        for (let qualityStep = 0; qualityStep < 7; qualityStep += 1) {
            const blob = await canvasToBlob(canvas, quality);
            bestBlob = blob;

            if (blob.size <= MAX_UPLOAD_BYTES) {
                return blob;
            }

            quality -= 0.1;
        }

        width = Math.max(320, Math.round(width * 0.85));
        height = Math.max(320, Math.round(height * 0.85));
    }

    if (!bestBlob) {
        throw new Error("Failed to compress image");
    }

    if (bestBlob.size > MAX_UPLOAD_BYTES) {
        throw new Error("Image could not be reduced below 250 KB. Try a smaller image.");
    }

    return bestBlob;
}

export default function ProductFormModal({
    isOpen,
    onClose,
    onSuccess,
    product,
}: ProductFormModalProps) {
    const supabase = createClient();
    const [categories, setCategories] = useState<Category[]>([]);
    const [, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        story: "",
        highlightsText: "",
        price: "",
        compareAtPrice: "",
        costPerItem: "",
        chargeTax: true,
        stock: "",
        categoryId: "",
        images: [] as string[],
        isActive: true,
        isFeatured: false,
        sku: "",
    });

    // SKU builder state
    const [skuType, setSkuType] = useState("");
    const [skuCustomType, setSkuCustomType] = useState("");
    const [skuColor, setSkuColor] = useState("");
    const [skuCustomColor, setSkuCustomColor] = useState("");
    const [skuSeq, setSkuSeq] = useState(1);
    const [isFetchingSeq, setIsFetchingSeq] = useState(false);

    const [imageInput, setImageInput] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            if (product) {
                setFormData({
                    name: product.name,
                    description: product.description || "",
                    story: product.story || "",
                    highlightsText: (product.highlights || []).join("\n"),
                    price: product.price.toString(),
                    compareAtPrice: product.compareAtPrice?.toString() || "",
                    costPerItem: product.costPerItem?.toString() || "",
                    chargeTax: product.chargeTax ?? true,
                    stock: product.stock.toString(),
                    categoryId: product.categoryId,
                    images: product.images || [],
                    isActive: product.isActive,
                    isFeatured: product.isFeatured,
                    sku: product.sku || "",
                });
                
                // If it has a SKU, try to extract its sequence to avoid overwriting it
                if (product.sku) {
                    const parts = product.sku.split('-');
                    if (parts.length >= 2) {
                        const seq = parseInt(parts[parts.length - 1]);
                        if (!isNaN(seq)) setSkuSeq(seq);
                    }
                }
            } else {
                setFormData({
                    name: "",
                    description: "",
                    story: "",
                    highlightsText: "",
                    price: "",
                    compareAtPrice: "",
                    costPerItem: "",
                    chargeTax: true,
                    stock: "",
                    categoryId: "",
                    images: [],
                    isActive: true,
                    isFeatured: false,
                    sku: "",
                });
                setSkuType("");
                setSkuCustomType("");
                setSkuColor("");
                setSkuCustomColor("");
                setSkuSeq(1);
                setIsFetchingSeq(false);
            }
            setImageInput("");
        }
    }, [isOpen, product]);

    // Auto-fetch next sequence
    useEffect(() => {
        if (!isOpen || !skuType || !skuColor || !formData.price) return;

        const fetchNextSeq = async () => {
            try {
                const typeValue = skuType === '__custom__' ? skuCustomType : skuType;
                const colorValue = skuColor === '__custom__' ? skuCustomColor : skuColor;
                if (!typeValue || !colorValue) return;

                const typePrefix = getTypePrefix(typeValue);
                const colorCode = getColorCode(colorValue);
                const priceTier = getPriceTierCode(Number(formData.price));
                
                // Prefix for search: JL-TYPE-COLOR-PRICE-
                const prefix = `JL-${typePrefix}-${colorCode}-${priceTier}-`;

                setIsFetchingSeq(true);
                const res = await fetch(`/api/admin/products?prefix=${prefix}`);
                if (res.ok) {
                    const data = await res.json();
                    setSkuSeq(data.nextSequence || 1);
                }
            } catch (err) {
                console.error("Failed to fetch next sequence:", err);
            } finally {
                setIsFetchingSeq(false);
            }
        };

        const timer = setTimeout(fetchNextSeq, 500); // Debounce to avoid too many calls
        return () => clearTimeout(timer);
    }, [skuType, skuCustomType, skuColor, skuCustomColor, formData.price, isOpen]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddImage = () => {
        if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
            setFormData({
                ...formData,
                images: [...formData.images, imageInput.trim()],
            });
            setImageInput("");
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData({
            ...formData,
            images: formData.images.filter((_, i) => i !== index),
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        setUploadingImage(true);

        try {
            const uploadedUrls: string[] = [];

            for (const file of files) {
                if (!file.type.startsWith("image/")) {
                    throw new Error(`${file.name} is not an image file`);
                }

                const compressedBlob = await compressImage(file);
                const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${sanitizeFileName(file.name)}.jpg`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("products")
                    .upload(filePath, compressedBlob, {
                        cacheControl: "3600",
                        contentType: "image/jpeg",
                        upsert: false,
                    });

                if (uploadError) {
                    throw new Error(uploadError.message);
                }

                const { data } = supabase.storage.from("products").getPublicUrl(filePath);
                if (!data.publicUrl) {
                    throw new Error("Failed to get uploaded image URL");
                }

                uploadedUrls.push(data.publicUrl);
            }

            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls.filter((url) => !prev.images.includes(url))],
            }));
        } catch (error) {
            console.error("Image upload failed:", error);
            alert(error instanceof Error ? error.message : "Failed to upload image");
        } finally {
            event.target.value = "";
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !formData.name ||
            !formData.price ||
            !formData.categoryId ||
            formData.images.length === 0
        ) {
            alert("Please fill in all required fields and add at least one image");
            return;
        }

        setSubmitting(true);
        try {
            const url = product
                ? `/api/admin/products`
                : `/api/admin/products`;
            const method = product ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    ...(product && { id: product.id }),
                    highlights: formData.highlightsText
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean),
                    price: parseFloat(formData.price),
                    compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
                    costPerItem: formData.costPerItem ? parseFloat(formData.costPerItem) : null,
                    stock: parseInt(formData.stock) || 0,
                    sku: formData.sku || null,
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to save product");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while saving the product");
        } finally {
            setSubmitting(false);
        }
    };

    const numericPrice = Number(formData.price || 0);
    const numericCostPerItem = Number(formData.costPerItem || 0);
    const profit = numericPrice - numericCostPerItem;
    const margin = numericPrice > 0 ? (profit / numericPrice) * 100 : 0;

    // SKU preview
    const skuPreview = useMemo(() => {
        const typeValue = skuType === '__custom__' ? skuCustomType : skuType;
        const colorValue = skuColor === '__custom__' ? skuCustomColor : skuColor;
        if (!typeValue || !colorValue) return '';
        const typeCode = getTypePrefix(typeValue);
        const colorCode = getColorCode(colorValue);
        const priceCode = numericPrice > 0 ? getPriceTierCode(numericPrice) : '—';
        return buildSku(typeCode, colorCode, priceCode, skuSeq);
    }, [skuType, skuCustomType, skuColor, skuCustomColor, numericPrice, skuSeq]);

    const handleGenerateSku = () => {
        if (skuPreview) {
            setFormData(prev => ({ ...prev, sku: skuPreview }));
        }
    };

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-background rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-background">
                    <h2 className="text-2xl font-bold text-foreground">
                        {product ? "Edit Product" : "Add New Product"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Product Name */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Product Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g., Golden Pearl Necklace"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Add product description..."
                            rows={3}
                        />
                    </div>

                    {/* Story */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Product Story
                        </label>
                        <textarea
                            value={formData.story}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    story: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder="Short emotional line shown near the product title"
                            rows={3}
                        />
                    </div>

                    {/* Highlights */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Style Highlights
                        </label>
                        <textarea
                            value={formData.highlightsText}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    highlightsText: e.target.value,
                                })
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            placeholder={"One highlight per line\nExample: Everyday layering: Pairs beautifully with a watch, bangles, or a clean cuff look.\nExample: Gift-ready feel: A polished piece that feels thoughtful without being too formal."}
                            rows={4}
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Use `Title: description` for each line. These will render as the small cards on the product page.
                        </p>
                    </div>

                    {/* Category & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Category *
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        categoryId: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Price (₹) *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        price: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Compare-at Price (Rs)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.compareAtPrice}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        compareAtPrice: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Cost per Item (Rs)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.costPerItem}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        costPerItem: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Profit</p>
                            <p className={`mt-1 text-lg font-bold ${profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                Rs {profit.toFixed(2)}
                            </p>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Margin</p>
                            <p className={`mt-1 text-lg font-bold ${margin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                {numericPrice > 0 ? `${margin.toFixed(1)}%` : "--"}
                            </p>
                        </div>
                    </div>

                    {/* SKU Builder */}
                    <div className="rounded-xl border-2 border-dashed border-amber-300/50 dark:border-amber-700/50 bg-amber-50/30 dark:bg-amber-900/10 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Wand2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <h3 className="font-bold text-foreground text-sm">SKU Builder</h3>
                            <span className="text-xs text-muted-foreground ml-auto">Format: JL-TYPE-COLOR-PRICE-SEQ</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            {/* Product Type */}
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Type</label>
                                <select
                                    value={skuType}
                                    onChange={(e) => setSkuType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                >
                                    <option value="">Select...</option>
                                    {Object.keys(PRODUCT_TYPE_PREFIXES)
                                        .filter((v, i, a) => a.indexOf(v) === i)
                                        .map((name) => (
                                            <option key={name} value={name}>
                                                {name} ({PRODUCT_TYPE_PREFIXES[name]})
                                            </option>
                                        ))}
                                    <option value="__custom__">✏️ Custom</option>
                                </select>
                                {skuType === '__custom__' && (
                                    <input
                                        type="text"
                                        value={skuCustomType}
                                        onChange={(e) => setSkuCustomType(e.target.value)}
                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="e.g. Tiara"
                                    />
                                )}
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Color</label>
                                <select
                                    value={skuColor}
                                    onChange={(e) => setSkuColor(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                >
                                    <option value="">Select...</option>
                                    {Object.entries(COLOR_CODES).map(([name, code]) => (
                                        <option key={name} value={name}>
                                            {name} ({code})
                                        </option>
                                    ))}
                                    <option value="__custom__">✏️ Custom</option>
                                </select>
                                {skuColor === '__custom__' && (
                                    <input
                                        type="text"
                                        value={skuCustomColor}
                                        onChange={(e) => setSkuCustomColor(e.target.value)}
                                        className="w-full mt-1 px-3 py-1.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        placeholder="e.g. Teal"
                                    />
                                )}
                            </div>

                            {/* Price Tier (auto) */}
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Price Tier</label>
                                <div className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-gray-100 dark:bg-white/5 text-foreground text-sm font-mono">
                                    {numericPrice > 0 ? getPriceTierCode(numericPrice) : '—'}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Auto from price</p>
                            </div>

                            {/* Sequence */}
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                                    Sequence # {isFetchingSeq && <Loader2 className="inline w-3 h-3 animate-spin text-amber-500" />}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={skuSeq}
                                    onChange={(e) => setSkuSeq(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                                    className={`w-full px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm ${isFetchingSeq ? 'opacity-50' : ''}`}
                                />
                            </div>
                        </div>

                        {/* Preview & Generate */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Generated SKU</label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm tracking-wider"
                                    placeholder="JL-NK-GLD-499-01"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleGenerateSku}
                                disabled={!skuPreview}
                                variant="outline"
                                className="mt-5 gap-1.5 border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                                <Wand2 className="w-4 h-4" />
                                Generate
                            </Button>
                        </div>
                        {skuPreview && formData.sku !== skuPreview && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                Preview: <span className="font-mono font-bold tracking-wider">{skuPreview}</span> — Click Generate to apply
                            </p>
                        )}
                    </div>

                    {/* Stock & Status */}
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-foreground mb-2">
                                Stock
                            </label>
                            <input
                                type="number"
                                value={formData.stock}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        stock: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0"
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isActive: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm font-medium text-foreground">
                                    Active
                                </span>
                            </label>
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.chargeTax}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            chargeTax: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm font-medium text-foreground">
                                    Charge Tax
                                </span>
                            </label>
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isFeatured: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm font-medium text-foreground">
                                    Featured
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                            Product Images *
                        </label>
                        <div className="mb-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/70 p-4 dark:border-white/15 dark:bg-white/[0.03]">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Upload from your desktop
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Images are automatically compressed to stay below 250 KB before upload.
                                    </p>
                                </div>
                                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-100 dark:border-white/15 dark:hover:bg-white/10">
                                    {uploadingImage ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Choose Photos
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={uploadingImage}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-3">
                            <input
                                type="url"
                                value={imageInput}
                                onChange={(e) => setImageInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddImage();
                                    }
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Enter image URL and press Enter or click Add"
                            />
                            <Button
                                type="button"
                                onClick={handleAddImage}
                                variant="outline"
                                className="gap-2"
                                disabled={!imageInput.trim() || uploadingImage}
                            >
                                <Upload className="w-4 h-4" />
                                Add
                            </Button>
                        </div>

                        {formData.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-3">
                                {formData.images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className="relative group bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden aspect-square"
                                    >
                                        <img
                                            src={img}
                                            alt={`Product ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-6 h-6 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                            You can upload images directly from your desktop or paste an image URL manually.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-white/10">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                            className="text-gray-700 dark:text-gray-300 border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || uploadingImage}
                            className="gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                product ? "Update Product" : "Create Product"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
