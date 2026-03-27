import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';

export const revalidate = 0;

const DEFAULT_CATEGORIES = [
    { name: 'Necklaces', slug: 'necklaces' },
    { name: 'Earrings', slug: 'earrings' },
    { name: 'Bangles', slug: 'bangles' },
    { name: 'Rings', slug: 'rings' },
    { name: 'Bracelets', slug: 'bracelets' },
    { name: 'Sets', slug: 'sets' },
];

const DEFAULT_PRODUCTS = [
    { name: 'Golden Pearl Necklace', category: 'necklaces', price: 1499, description: 'Elegant pearl necklace with timeless design.', image: '/products/golden-pearl-necklace.png' },
    { name: 'Diamond Studs', category: 'earrings', price: 799, description: 'Classic diamond studs for daily and occasion wear.', image: '/products/diamond-studs.png' },
    { name: 'Elegant Gold Bangles', category: 'bangles', price: 1299, description: 'Gold bangles with traditional detailing.', image: '/products/gold-bangles.png' },
    { name: 'Ruby Statement Ring', category: 'rings', price: 599, description: 'Bold ruby ring with premium finish.', image: '/products/ruby-ring.png' },
    { name: 'Silver Chain Bracelet', category: 'bracelets', price: 299, description: 'Minimal silver bracelet for everyday style.', image: '/products/silver-chain-bracelet.png' },
    { name: 'Bridal Jewellery Set', category: 'sets', price: 3499, description: 'Complete bridal jewellery set for special occasions.', image: '/products/bridal-jewellery-set.png' },
];

const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

function getFallbackProducts(searchParams: URLSearchParams) {
    const category = searchParams.get('category');
    const search = (searchParams.get('search') || '').toLowerCase();
    const ids = searchParams.get('ids');
    const idFilter = ids ? new Set(ids.split(',')) : null;

    const mapped = DEFAULT_PRODUCTS.map((p, index) => ({
        id: `demo-${index + 1}`,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: 50,
        compareAtPrice: Math.round(p.price * 1.6),
        costPerItem: null,
        chargeTax: true,
        originalPrice: Math.round(p.price * 1.6),
        image: p.image,
        description: p.description,
        rating: 4.5,
    }));

    return mapped.filter((p) => {
        if (idFilter && !idFilter.has(p.id)) return false;
        if (category && category !== 'all' && category !== 'liked' && p.category !== category) return false;
        if (search && !p.name.toLowerCase().includes(search)) return false;
        
        
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

        const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

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

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const ids = searchParams.get('ids');
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const allowDemoFallback = !isProductionRuntime && !includeInactive;

        const where: Prisma.ProductWhereInput = {};

        // Filter by active status (unless admin requests all)
        if (!includeInactive) {
            where.isActive = true;
        }

        // 0. IDs Filter (for wishlist/cart)
        if (ids) {
            where.id = { in: ids.split(',') };
        }

        // 1. Category Filter
        if (category && category !== 'all' && category !== 'liked') {
            const dbCategory = await prisma.category.findUnique({
                where: { slug: category }
            });
            if (dbCategory) {
                where.categoryId = dbCategory.id;
            }
        }

        // 2. Search Filter
        if (search) {
            where.name = {
                contains: search,
                mode: 'insensitive',
            };
        }


        let products = await prisma.product.findMany({
            where,
            select: {
                id: true,
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
                        id: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const isUnfilteredRequest = !category && !search && !ids;
        if (products.length === 0 && isUnfilteredRequest) {
            if (allowDemoFallback) {
                await seedIfEmpty();
            }
            products = await prisma.product.findMany({
                where,
                select: {
                    id: true,
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
                            id: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        // Transform to match frontend expectations
        const formatted = products.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || null,
            category: p.category,
            categoryId: p.categoryId,
            category_slug: p.category.slug,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
            costPerItem: p.costPerItem != null ? Number(p.costPerItem) : null,
            chargeTax: p.chargeTax,
            stock: p.stock,
            outOfStockSince: p.outOfStockSince?.toISOString() ?? null,
            images: p.images,
            originalPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : Number(p.price),
            image: p.images[0] || '/products/golden-pearl-necklace.png',
            description: p.description,
            isActive: p.isActive,
            isFeatured: p.isFeatured,
            rating: 4.5,
        }));

        return NextResponse.json(formatted, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Failed to fetch products:', error);
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const allowDemoFallback = !isProductionRuntime && !includeInactive;

        if (allowDemoFallback) {
            return NextResponse.json(getFallbackProducts(searchParams), {
                headers: {
                    'Cache-Control': 'no-store',
                },
            });
        }

        return NextResponse.json(
            { error: 'Failed to load products from database' },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-store',
                },
            }
        );
    }
}

