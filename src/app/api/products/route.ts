import { NextResponse } from 'next/server';
import { getFallbackStorefrontProducts, getStorefrontProducts } from '@/lib/storefront-products';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const ids = searchParams.get('ids');
        const includeInactive = searchParams.get('includeInactive') === 'true';
        const products = await getStorefrontProducts({
            category,
            search,
            ids: ids ? ids.split(',') : undefined,
            includeInactive,
        });

        return NextResponse.json(products, {
            headers: includeInactive || Boolean(search)
                ? { 'Cache-Control': 'no-store' }
                : undefined,
        });
    } catch (error) {
        console.error('Failed to fetch products:', error);
        const { searchParams } = new URL(request.url);
        if (searchParams.get('includeInactive') !== 'true') {
            return NextResponse.json(getFallbackStorefrontProducts(searchParams), {
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

