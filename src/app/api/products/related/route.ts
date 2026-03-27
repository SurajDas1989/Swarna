import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 12);

        if (!productId) {
            return NextResponse.json({ error: 'productId is required' }, { status: 400 });
        }

        // Fetch the current product's category
        const currentProduct = await prisma.product.findUnique({
            where: { id: productId },
            select: {
                categoryId: true,
                category: { select: { slug: true } },
            },
        });

        if (!currentProduct) {
            return NextResponse.json([], { status: 200 });
        }

        const relatedProducts = await prisma.product.findMany({
            where: {
                categoryId: currentProduct.categoryId,
                id: { not: productId },
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                price: true,
                compareAtPrice: true,
                stock: true,
                images: true,
                description: true,
                category: {
                    select: {
                        slug: true,
                        name: true,
                    },
                },
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        const formatted = relatedProducts.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: Number(p.price),
            compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : null,
            originalPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : Number(p.price),
            image: p.images[0] || '/products/golden-pearl-necklace.png',
            images: p.images,
            description: p.description,
            stock: p.stock,
            rating: 4.5,
        }));

        const categorySlug = currentProduct.category?.slug || 'all';

        return NextResponse.json(formatted, {
            headers: {
                'Cache-Control': `public, s-maxage=120, stale-while-revalidate=600`,
                'X-Cache-Tags': `products:related,category:${categorySlug}`,
            },
        });
    } catch (error) {
        console.error('Failed to fetch related products:', error);
        return NextResponse.json({ error: 'Failed to load related products' }, { status: 500 });
    }
}
