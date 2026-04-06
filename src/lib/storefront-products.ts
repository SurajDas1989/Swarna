import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";

const DEFAULT_PRODUCTS = [
    { name: "Golden Pearl Necklace", category: "necklaces", price: 1499, description: "Elegant pearl necklace with timeless design.", image: "/products/golden-pearl-necklace.png" },
    { name: "Diamond Studs", category: "earrings", price: 799, description: "Classic diamond studs for daily and occasion wear.", image: "/products/diamond-studs.png" },
    { name: "Elegant Gold Bangles", category: "bangles", price: 1299, description: "Gold bangles with traditional detailing.", image: "/products/gold-bangles.png" },
    { name: "Ruby Statement Ring", category: "rings", price: 599, description: "Bold ruby ring with premium finish.", image: "/products/ruby-ring.png" },
    { name: "Silver Chain Bracelet", category: "bracelets", price: 299, description: "Minimal silver bracelet for everyday style.", image: "/products/silver-chain-bracelet.png" },
    { name: "Bridal Jewellery Set", category: "sets", price: 3499, description: "Complete bridal jewellery set for special occasions.", image: "/products/bridal-jewellery-set.png" },
];

const DEFAULT_CATEGORIES = [
    { name: "Necklaces", slug: "necklaces" },
    { name: "Earrings", slug: "earrings" },
    { name: "Bangles", slug: "bangles" },
    { name: "Rings", slug: "rings" },
    { name: "Bracelets", slug: "bracelets" },
    { name: "Sets", slug: "sets" },
];

const isProductionRuntime = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
const STOREFRONT_LIST_REVALIDATE_SECONDS = 120;
const STOREFRONT_SEARCH_REVALIDATE_SECONDS = 60;

type ProductListRecord = {
    id: string;
    slug: string;
    name: string;
    sku: string | null;
    price: unknown;
    compareAtPrice: unknown;
    costPerItem: unknown;
    chargeTax: boolean;
    stock: number;
    outOfStockSince: Date | null;
    images: string[];
    description: string | null;
    isActive: boolean;
    isFeatured: boolean;
    categoryId: string;
    category: {
        slug: string;
        name: string;
        id: string;
    };
};

type ProductDetailRecord = {
    id: string;
    slug: string;
    name: string;
    sku: string | null;
    price: unknown;
    compareAtPrice: unknown;
    costPerItem: unknown;
    chargeTax: boolean;
    images: string[];
    description: string | null;
    stock: number;
    outOfStockSince: Date | null;
    isActive: boolean;
    category: {
        slug: string;
        name?: string;
    };
};

type CategoryRecord = {
    id: string;
    slug: string;
    name: string;
};

export type StorefrontProductListQuery = {
    category?: string | null;
    search?: string | null;
    ids?: string[] | null;
    includeInactive?: boolean;
};

export function getProductTag(id: string) {
    return `product:${id}`;
}

export function getCategoryTag(slug: string) {
    return `category:${slug}`;
}

export function getProductsListTag() {
    return "products:list";
}

export function getProductsRelatedTag() {
    return "products:related";
}

function formatProductListItem(product: ProductListRecord) {
    const price = Number(product.price);
    const compareAtPrice = product.compareAtPrice != null ? Number(product.compareAtPrice) : null;

    return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        sku: product.sku || null,
        category: product.category,
        categoryId: product.categoryId,
        category_slug: product.category.slug,
        price,
        compareAtPrice,
        costPerItem: product.costPerItem != null ? Number(product.costPerItem) : null,
        chargeTax: product.chargeTax,
        stock: product.stock,
        outOfStockSince: product.outOfStockSince?.toISOString() ?? null,
        images: product.images,
        originalPrice: compareAtPrice ?? price,
        image: product.images[0] || "/products/golden-pearl-necklace.png",
        description: product.description || "",
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        rating: 4.5,
    };
}

function formatProductDetail(product: ProductDetailRecord) {
    const price = Number(product.price);
    const compareAtPrice = product.compareAtPrice != null ? Number(product.compareAtPrice) : null;

    return {
        id: product.id,
        slug: product.slug || "",
        name: product.name,
        sku: product.sku || null,
        category: product.category.slug,
        price,
        compareAtPrice,
        costPerItem: product.costPerItem != null ? Number(product.costPerItem) : null,
        chargeTax: product.chargeTax,
        originalPrice: compareAtPrice ?? price,
        image: product.images[0] || "/products/golden-pearl-necklace.png",
        images: product.images,
        description: product.description || "",
        rating: 4.5,
        stock: product.stock,
        outOfStockSince: product.outOfStockSince?.toISOString() ?? null,
        isActive: product.isActive,
    };
}

function formatProductDetailWithSlug(product: any) {
    const price = Number(product.price);
    const compareAtPrice = product.compareAtPrice != null ? Number(product.compareAtPrice) : null;

    return {
        id: product.id,
        slug: product.slug || "",
        name: product.name,
        sku: product.sku || null,
        category: product.category?.slug || "",
        price,
        compareAtPrice,
        costPerItem: product.costPerItem != null ? Number(product.costPerItem) : null,
        chargeTax: product.chargeTax,
        originalPrice: compareAtPrice ?? price,
        image: product.images[0] || "/products/golden-pearl-necklace.png",
        images: product.images,
        description: product.description || "",
        rating: 4.5,
        stock: product.stock,
        outOfStockSince: product.outOfStockSince?.toISOString() ?? null,
        isActive: product.isActive,
    };
}

function getFallbackProducts(searchParams: URLSearchParams) {
    const category = searchParams.get("category");
    const search = (searchParams.get("search") || "").toLowerCase();
    const ids = searchParams.get("ids");
    const idFilter = ids ? new Set(ids.split(",")) : null;

    return DEFAULT_PRODUCTS.map((product, index) => ({
        id: `demo-${index + 1}`,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: 50,
        compareAtPrice: Math.round(product.price * 1.6),
        costPerItem: null,
        chargeTax: true,
        originalPrice: Math.round(product.price * 1.6),
        image: product.image,
        description: product.description,
        rating: 4.5,
    })).filter((product) => {
        if (idFilter && !idFilter.has(product.id)) return false;
        if (category && category !== "all" && category !== "liked" && product.category !== category) return false;
        if (search && !product.name.toLowerCase().includes(search)) return false;
        return true;
    });
}

async function seedIfEmpty() {
    const productCount = await prisma.product.count();
    if (productCount > 0) return;

    for (const category of DEFAULT_CATEGORIES) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: {},
            create: category,
        });
    }

    for (const product of DEFAULT_PRODUCTS) {
        const category = await prisma.category.findUnique({ where: { slug: product.category } });
        if (!category) continue;

        const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

        await prisma.product.upsert({
            where: { slug },
            update: {
                price: product.price,
                compareAtPrice: Math.round(product.price * 1.6),
                description: product.description,
                images: [product.image],
                categoryId: category.id,
                stock: 50,
                isFeatured: true,
            },
            create: {
                name: product.name,
                slug,
                price: product.price,
                compareAtPrice: Math.round(product.price * 1.6),
                description: product.description,
                images: [product.image],
                categoryId: category.id,
                stock: 50,
                isFeatured: true,
            },
        });
    }
}

export function getDemoProductById(id: string) {
    if (!id.startsWith("demo-")) return null;

    const index = Number(id.replace("demo-", "")) - 1;
    if (Number.isNaN(index) || index < 0 || index >= DEFAULT_PRODUCTS.length) return null;

    const product = DEFAULT_PRODUCTS[index];
    return {
        id: `demo-${index + 1}`,
        name: product.name,
        category: product.category,
        price: product.price,
        compareAtPrice: Math.round(product.price * 1.6),
        costPerItem: null,
        chargeTax: true,
        originalPrice: Math.round(product.price * 1.6),
        image: product.image,
        images: [product.image],
        description: product.description,
        rating: 4.5,
        stock: 50,
        isActive: true,
        outOfStockSince: null,
        sku: null,
    };
}

async function fetchCategoryBySlug(slug: string): Promise<CategoryRecord | null> {
    return prisma.category.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            name: true,
        },
    });
}

async function fetchStorefrontProductsFromDb(query: StorefrontProductListQuery) {
    const where: {
        isActive?: boolean;
        id?: { in: string[] };
        categoryId?: string;
        name?: { contains: string; mode: "insensitive" };
    } = {};

    if (!query.includeInactive) {
        where.isActive = true;
    }

    if (query.ids?.length) {
        where.id = { in: query.ids };
    }

    if (query.category && query.category !== "all" && query.category !== "liked") {
        const category = await fetchCategoryBySlug(query.category);
        if (category) {
            where.categoryId = category.id;
        }
    }

    if (query.search) {
        where.name = {
            contains: query.search,
            mode: "insensitive",
        };
    }

    return prisma.product.findMany({
        where,
        select: {
            id: true,
            slug: true,
            name: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            costPerItem: true,
            chargeTax: true,
            stock: true,
            outOfStockSince: true,
            images: true,
            description: true,
            isActive: true,
            isFeatured: true,
            categoryId: true,
            category: {
                select: {
                    slug: true,
                    name: true,
                    id: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

async function fetchProductDetailFromDb(id: string) {
    const product = await prisma.product.findUnique({
        where: { id },
        select: {
            id: true,
            slug: true,
            name: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            costPerItem: true,
            chargeTax: true,
            images: true,
            description: true,
            stock: true,
            outOfStockSince: true,
            isActive: true,
            category: {
                select: {
                    slug: true,
                    name: true,
                },
            },
        },
    });

    return product ? formatProductDetail(product) : null;
}

async function fetchProductDetailBySlugFromDb(slug: string) {
    const product = await prisma.product.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            name: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            costPerItem: true,
            chargeTax: true,
            images: true,
            description: true,
            stock: true,
            outOfStockSince: true,
            isActive: true,
            category: {
                select: {
                    slug: true,
                    name: true,
                },
            },
        },
    });

    return product ? formatProductDetailWithSlug(product) : null;
}

async function fetchProductCategoryMeta(productId: string) {
    return prisma.product.findUnique({
        where: { id: productId },
        select: {
            categoryId: true,
            category: {
                select: {
                    slug: true,
                },
            },
        },
    });
}

async function fetchRelatedProductsFromDb(productId: string, categoryId: string, limit: number) {
    const products = await prisma.product.findMany({
        where: {
            categoryId,
            id: { not: productId },
            isActive: true,
        },
        select: {
            id: true,
            slug: true,
            name: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            costPerItem: true,
            chargeTax: true,
            stock: true,
            outOfStockSince: true,
            images: true,
            description: true,
            isActive: true,
            isFeatured: true,
            categoryId: true,
            category: {
                select: {
                    slug: true,
                    name: true,
                    id: true,
                },
            },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
    });

    return products.map(formatProductListItem);
}

function getListCacheKey(query: StorefrontProductListQuery) {
    return [
        "storefront-products-list",
        `category:${query.category || "all"}`,
        `search:${query.search || ""}`,
        `ids:${query.ids?.join(",") || ""}`,
        `inactive:${query.includeInactive ? "1" : "0"}`,
    ];
}

function getListCacheTags(query: StorefrontProductListQuery) {
    const tags = [getProductsListTag()];

    if (query.category && query.category !== "all" && query.category !== "liked") {
        tags.push(getCategoryTag(query.category));
    }

    if (query.ids?.length) {
        tags.push(...query.ids.map(getProductTag));
    }

    return [...new Set(tags)];
}

export async function getCachedStorefrontProducts(query: StorefrontProductListQuery = {}) {
    const normalizedQuery: StorefrontProductListQuery = {
        category: query.category || undefined,
        search: query.search || undefined,
        ids: query.ids?.filter(Boolean) || undefined,
        includeInactive: Boolean(query.includeInactive),
    };

    const getProducts = unstable_cache(
        async () => {
            let products = await fetchStorefrontProductsFromDb(normalizedQuery);
            const isUnfilteredRequest = !normalizedQuery.category && !normalizedQuery.search && !normalizedQuery.ids?.length;

            if (products.length === 0 && isUnfilteredRequest && !normalizedQuery.includeInactive && !isProductionRuntime) {
                await seedIfEmpty();
                products = await fetchStorefrontProductsFromDb(normalizedQuery);
            }

            return products.map(formatProductListItem);
        },
        getListCacheKey(normalizedQuery),
        {
            revalidate: normalizedQuery.search ? STOREFRONT_SEARCH_REVALIDATE_SECONDS : STOREFRONT_LIST_REVALIDATE_SECONDS,
            tags: getListCacheTags(normalizedQuery),
        }
    );

    return getProducts();
}

export async function getStorefrontProducts(query: StorefrontProductListQuery = {}) {
    const normalizedQuery: StorefrontProductListQuery = {
        category: query.category || undefined,
        search: query.search || undefined,
        ids: query.ids?.filter(Boolean) || undefined,
        includeInactive: Boolean(query.includeInactive),
    };

    if (normalizedQuery.includeInactive) {
        const products = await fetchStorefrontProductsFromDb(normalizedQuery);
        return products.map(formatProductListItem);
    }

    return getCachedStorefrontProducts(normalizedQuery);
}
export async function getCachedProductById(id: string) {
    const getProduct = unstable_cache(
        async () => fetchProductDetailFromDb(id),
        ["storefront-product", id],
        { revalidate: 60, tags: [getProductTag(id)] }
    );

    return getProduct();
}

export async function getCachedProductBySlug(slug: string) {
    const getProduct = unstable_cache(
        async () => fetchProductDetailBySlugFromDb(slug),
        ["storefront-product", `slug:${slug}`],
        { revalidate: 60, tags: [`product-slug:${slug}`] }
    );

    return getProduct();
}

export async function getCachedProductsByIds(ids: string[]) {
    const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
    if (uniqueIds.length === 0) {
        return [];
    }

    return getCachedStorefrontProducts({ ids: uniqueIds });
}

export async function getCachedProductsByCategorySlug(categorySlug: string) {
    return getCachedStorefrontProducts({ category: categorySlug });
}

export async function getCachedRelatedProducts(productId: string, limit: number) {
    const getMeta = unstable_cache(
        async () => fetchProductCategoryMeta(productId),
        ["storefront-product-category-meta", productId],
        { revalidate: 60, tags: [getProductTag(productId)] }
    );

    const meta = await getMeta();
    if (!meta?.categoryId || !meta.category?.slug) {
        return [];
    }

    const getRelated = unstable_cache(
        async () => fetchRelatedProductsFromDb(productId, meta.categoryId, limit),
        ["storefront-related-products", productId, String(limit), meta.category.slug],
        {
            revalidate: 120,
            tags: [getProductsRelatedTag(), getCategoryTag(meta.category.slug), getProductTag(productId)],
        }
    );

    return getRelated();
}

export function getFallbackStorefrontProducts(searchParams: URLSearchParams) {
    return getFallbackProducts(searchParams);
}

/**
 * Utility to generate a URL-safe unique slug for a product.
 * Useful for future "upload from link" functionality where name might be the only available field.
 */
export async function generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
        
    let finalSlug = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await prisma.product.findUnique({
            where: { slug: finalSlug },
            select: { id: true }
        });
        
        if (!existing) break;
        finalSlug = `${baseSlug}-${counter++}`;
    }

    return finalSlug;
}
