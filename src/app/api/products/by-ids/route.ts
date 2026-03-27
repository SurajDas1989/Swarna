import { NextResponse } from 'next/server';
import { getCachedProductsByIds } from '@/lib/storefront-products';

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

        const products = await getCachedProductsByIds(ids);
        return NextResponse.json(products);
    } catch (error) {
        console.error('Failed to fetch products by IDs:', error);
        return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
    }
}
