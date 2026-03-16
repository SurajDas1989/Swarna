import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import prisma from '@/lib/prisma';

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

        // Run as an atomic transaction to ensure ledger and balance stay perfectly synchronized
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current user
            const targetUser = await tx.user.findUnique({
                where: { id: userId }
            });

            if (!targetUser) {
                throw new Error("Target user not found");
            }

            // 2. Prevent negative balance
            const currentCredit = parseFloat(targetUser.storeCredit.toString());
            const newCredit = currentCredit + numericAmount;

            if (newCredit < 0) {
                throw new Error(`Insufficient store credit. User only has ${currentCredit} available to deduct.`);
            }

            // 3. Create the ledger entry
            const transactionRecord = await tx.storeCreditTransaction.create({
                data: {
                    userId,
                    amount: numericAmount,
                    reason,
                    referenceId: referenceId || null,
                    adminId: session.user.id
                }
            });

            // 4. Update the user's total active credit balance
            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    storeCredit: {
                        increment: numericAmount
                    }
                }
            });

            return { transactionRecord, updatedStoreCredit: updatedUser.storeCredit };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Credit Issuance Error:", error);
        return NextResponse.json({ error: error.message || 'Failed to process store credit' }, { status: 500 });
    }
}
