import { NextResponse } from 'next/server';
import { getDeliveryEstimate } from '@/lib/services/shiprocket';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const pincode = searchParams.get('pincode');
        const codParam = searchParams.get('cod');
        const weightParam = searchParams.get('weightKg');

        if (!pincode || !/^\d{6}$/.test(pincode)) {
            return NextResponse.json({ error: 'Valid 6-digit pincode is required' }, { status: 400 });
        }

        const parsedWeight = weightParam ? Number(weightParam) : undefined;
        const cod = codParam == null ? true : codParam === '1';
        const weightKg = Number.isFinite(parsedWeight) ? parsedWeight : undefined;

        const estimate = await getDeliveryEstimate(pincode, { cod, weightKg });

        return NextResponse.json(estimate);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch delivery estimate';
        console.error('Shiprocket Estimate Error:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
