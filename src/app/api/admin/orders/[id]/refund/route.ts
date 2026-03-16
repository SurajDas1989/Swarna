import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { processOrderRefund } from '@/lib/services/refundOrder';
import prisma from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Admin Status
        const isAdmin = session.user.app_metadata?.role === 'ADMIN' || session.user.user_metadata?.role === 'ADMIN';
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const resolvedParams = await params;
        const orderId = resolvedParams.id;
        const body = await request.json();
        
        const { refundAmount, reason, refundMethod } = body;

        if (!orderId || !refundAmount || !reason || !refundMethod) {
            return NextResponse.json({ error: 'Missing required fields: refundAmount, reason, refundMethod.' }, { status: 400 });
        }

        const numericAmount = parseFloat(refundAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return NextResponse.json({ error: 'Invalid refund amount.' }, { status: 400 });
        }
        
        // Execute Centralized Refund Service
        const result = await processOrderRefund({
            orderId,
            refundAmount: numericAmount,
            reason,
            adminId: session.user.id,
            refundMethod: refundMethod as 'ORIGINAL' | 'STORE_CREDIT_ONLY'
        });

        return NextResponse.json(result);
        
    } catch (error: any) {
        console.error("Refund Processing Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to process refund' }, { status: 500 });
    }
}
