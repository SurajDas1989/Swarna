import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';
import { mutateStoreCredit } from '@/lib/services/storeCredit';

export async function POST(request: Request) {
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

        const body = await request.json();
        const { userId, amount, reason, referenceId } = body;

        if (!userId || !amount || !reason) {
            return NextResponse.json({ error: 'Missing required fields: userId, amount, reason.' }, { status: 400 });
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount === 0) {
            return NextResponse.json({ error: 'Invalid amount. Cannot be zero.' }, { status: 400 });
        }

        // 2. Call the Central Service to mutate the ledger atomically
        const result = await mutateStoreCredit({
            userId,
            amount: numericAmount, // Positive value since admin is issuing generic credit
            type: 'ADMIN_ADJUSTMENT', // Using the new explicit Enum
            reason,
            referenceId,
            adminId: session.user.id
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Credit Issuance Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to process store credit' }, { status: 500 });
    }
}
