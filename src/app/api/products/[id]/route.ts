import { NextResponse } from 'next/server';
import { getCachedProductById, getDemoProductById } from '@/lib/storefront-products';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const demoProduct = getDemoProductById(id);
        if (demoProduct) {
            return NextResponse.json(demoProduct);
        }

        const product = await getCachedProductById(id);

        if (!product) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(product);
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
