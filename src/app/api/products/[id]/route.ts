import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_PRODUCTS = [
    { name: 'Golden Pearl Necklace', category: 'necklaces', price: 1499, description: 'Elegant pearl necklace with timeless design.', image: '/products/golden-pearl-necklace.png' },
    { name: 'Diamond Studs', category: 'earrings', price: 799, description: 'Classic diamond studs for daily and occasion wear.', image: '/products/diamond-studs.png' },
    { name: 'Elegant Gold Bangles', category: 'bangles', price: 1299, description: 'Gold bangles with traditional detailing.', image: '/products/gold-bangles.png' },
    { name: 'Ruby Statement Ring', category: 'rings', price: 599, description: 'Bold ruby ring with premium finish.', image: '/products/ruby-ring.png' },
    { name: 'Silver Chain Bracelet', category: 'bracelets', price: 299, description: 'Minimal silver bracelet for everyday style.', image: '/products/silver-chain-bracelet.png' },
    { name: 'Bridal Jewellery Set', category: 'sets', price: 3499, description: 'Complete bridal jewellery set for special occasions.', image: '/products/bridal-jewellery-set.png' },
];

function getDemoProductById(id: string) {
    if (!id.startsWith('demo-')) return null;
    const index = Number(id.replace('demo-', '')) - 1;
    if (Number.isNaN(index) || index < 0 || index >= DEFAULT_PRODUCTS.length) return null;

    const p = DEFAULT_PRODUCTS[index];
    return {
        id: `demo-${index + 1}`,
        name: p.name,
        category: p.category,
        price: p.price,
        compareAtPrice: Math.round(p.price * 1.6),
        costPerItem: null,
        chargeTax: true,
        originalPrice: Math.round(p.price * 1.6),
        image: p.image,
        images: [p.image],
        description: p.description,
        rating: 4.5,
        stock: 50,
        isActive: true,
    };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const demoProduct = getDemoProductById(id);
        if (demoProduct) {
            return NextResponse.json(demoProduct);
        }

        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
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
                        slug: true
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const formatted = {
            id: product.id,
            name: product.name,
            sku: product.sku || null,
            category: product.category.slug,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : null,
            costPerItem: product.costPerItem != null ? Number(product.costPerItem) : null,
            chargeTax: product.chargeTax,
            originalPrice: product.compareAtPrice != null ? Number(product.compareAtPrice) : Number(product.price),
            image: product.images[0] || '/products/golden-pearl-necklace.png',
            images: product.images,
            description: product.description,
            rating: 4.5,
            stock: product.stock,
            outOfStockSince: product.outOfStockSince?.toISOString() ?? null,
            isActive: product.isActive,
        };

        return NextResponse.json(formatted, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Failed to fetch product:', error);

        const { id } = await params;
        const demoProduct = getDemoProductById(id);
        if (demoProduct) {
            return NextResponse.json(demoProduct);
        }

        return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }
}
