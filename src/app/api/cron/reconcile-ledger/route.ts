import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// This acts as a nightly Cron job to ensure Fintech-level integrity of the ledger.
// It detects database tampering, race conditions, or unauthorized credit injections.

export async function GET(request: Request) {
    // Basic security: In production, ensure this is called by your Cron provider (e.g. Vercel)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET !== undefined && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log("Starting Nightly Ledger Reconciliation...");
    const discrepancies: any[] = [];
    let reviewedUsers = 0;

    try {
        // We evaluate users in batches. For a massive app, use pagination
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                storeCredit: true,
                reservedStoreCredit: true
            }
        });

        for (const user of users) {
             reviewedUsers++;
             
             // What does the active system say they own?
             const activeBalance = Number(user.storeCredit);
             const reservedBalance = Number(user.reservedStoreCredit);
             const combinedClaim = activeBalance + reservedBalance;

             // What does the immutable ledger history say they should own?
             const ledgerSumAggr = await prisma.storeCreditTransaction.aggregate({
                 where: { userId: user.id },
                 _sum: { amount: true }
             });

             const totalLedgerHistory = Number(ledgerSumAggr._sum.amount || 0);

             // FinTech validation rule: User's total claims MUST equal total historical ledger injections - deductions
             // (Combined claim = active + reserved)
             
             // We use an epsilon check for float precision issues, though Decimal should handle this
             if (Math.abs(combinedClaim - totalLedgerHistory) > 0.01) {
                 const discrepancyReport = {
                     userId: user.id,
                     email: user.email,
                     activeBalance,
                     reservedBalance,
                     combinedClaim,
                     ledgerHistoryTotal: totalLedgerHistory,
                     deviation: activeBalance - totalLedgerHistory // difference
                 };
                 discrepancies.push(discrepancyReport);
                 console.error(`🚨 CRITICAL LEDGER DISCREPANCY DETECTED:`, discrepancyReport);
                 
                 // TODO: Wire up to Sentry, Datadog or Slack Webhook to alert engineering immediately
             }
        }

        const runReport = {
            status: discrepancies.length === 0 ? "PASSED" : "FAILED",
            usersVerified: reviewedUsers,
            discrepanciesFound: discrepancies.length,
            details: discrepancies
        };

        if (discrepancies.length > 0) {
            // Usually returns a 500 so the Cron monitor registers a failure alert
            return NextResponse.json(runReport, { status: 500 });
        }

        return NextResponse.json(runReport, { status: 200 });

    } catch (error) {
        console.error("Reconciliation Job Failed unexpectedly:", error);
        return NextResponse.json({ error: "Reconciliation process crashed" }, { status: 500 });
    }
}
