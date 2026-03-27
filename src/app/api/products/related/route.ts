import { NextResponse } from 'next/server';
import { getCachedRelatedProducts } from '@/lib/storefront-products';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const limit = Math.min(parseInt(searchParams.get('limit') || '4', 10), 12);

        if (!productId) {
            return NextResponse.json({ error: 'productId is required' }, { status: 400 });
        }

        const relatedProducts = await getCachedRelatedProducts(productId, limit);
        return NextResponse.json(relatedProducts);
    } catch (error) {
        console.error('Failed to fetch related products:', error);
        return NextResponse.json({ error: 'Failed to load related products' }, { status: 500 });
    }
}
