import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const idsParam = searchParams.get('ids');

        if (!idsParam || !idsParam.trim()) {
            return NextResponse.json([], { status: 200 });
        }

        // De-duplicate and clean the IDs
        const ids = [...new Set(idsParam.split(',').map((id) => id.trim()).filter(Boolean))];

        if (ids.length === 0) {
            return NextResponse.json([], { status: 200 });
        }

        const products = await prisma.product.findMany({
            where: {
                id: { in: ids },
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
            orderBy: { createdAt: 'desc' },
        });

        const formatted = products.map((p) => ({
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

        return NextResponse.json(formatted, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Failed to fetch products by IDs:', error);
        return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
    }
}
