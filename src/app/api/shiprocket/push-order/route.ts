import { NextResponse } from 'next/server';
import { requireAdminOrStaff } from '@/lib/supabase-server';
import { createCustomOrder } from '@/lib/services/shiprocket';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        // Authenticate admin
        const sessionResult = await requireAdminOrStaff();
        if ("error" in sessionResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const result = await createCustomOrder(orderId);

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        console.error('Shiprocket Push Error:', error);
        return NextResponse.json({ success: false, error: error.message || 'Failed to push order to Shiprocket' }, { status: 500 });
    }
}
