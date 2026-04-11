import { NextResponse } from 'next/server';
import { getDeliveryEstimate } from '@/lib/services/shiprocket';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pincode = searchParams.get('pincode');

        if (!pincode || !/^\d{6}$/.test(pincode)) {
            return NextResponse.json({ error: 'Valid 6-digit pincode is required' }, { status: 400 });
        }

        const estimate = await getDeliveryEstimate(pincode);

        return NextResponse.json(estimate);
    } catch (error: any) {
        console.error('Shiprocket Estimate Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch delivery estimate' }, { status: 500 });
    }
}
