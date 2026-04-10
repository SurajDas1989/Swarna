import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

type TransactionType = 'EARNED' | 'REFUNDED' | 'SPENT' | 'ADMIN_ADJUSTMENT';

interface StoreCreditMutationOptions {
    userId: string;
    amount: number;
    type: TransactionType;
    reason: string;
    referenceId?: string | null;
    adminId?: string | null;
    /**
     * If true, we expect the user to already have sufficient `storeCredit` - `reservedStoreCredit` balance to cover a negative amount.
     */
    enforceAvailability?: boolean;
}

/**
 * The SINGLE SOURCE OF TRUTH for modifying a User's Store Credit.
 * ALL API routes, Webhooks, and Admin panels MUST use this function.
 * It guarantees that the ledger accurately tracks every single balance change and handles atomic constraints.
 */
export async function mutateStoreCredit({
    userId,
    amount,
    type,
    reason,
    referenceId = null,
    adminId = null,
    enforceAvailability = true
}: StoreCreditMutationOptions) {
    if (amount === 0) {
        throw new Error("Store credit mutation amount cannot be exactly 0.");
    }

    // Negative amounts represent SPENT flows (e.g deduct)
    const isDeduction = amount < 0;

    return await prisma.$transaction(async (tx) => {
        // 1. Lock the user row for update (prevents concurrent race conditions via Prisma Raw SQL)
        // Using raw query to apply FOR UPDATE locking, ensuring atomic serializability.
        const users: any[] = await tx.$queryRaw`SELECT "storeCredit", "reservedStoreCredit" FROM users WHERE id = ${userId} FOR UPDATE`;
        
        if (!users || users.length === 0) {
            throw new Error(`User ${userId} not found during store credit mutation.`);
        }

        const user = users[0];
        const currentCredit = parseFloat(user.storeCredit.toString());
        const reservedCredit = parseFloat(user.reservedStoreCredit.toString());
        const availableCredit = currentCredit - reservedCredit;

        // 2. Validate availability for deductions
        if (isDeduction && enforceAvailability && availableCredit < Math.abs(amount)) {
            throw new Error(`Insufficient available store credit. User has ${availableCredit} available.`);
        }

        const exactAmount = new Prisma.Decimal(amount);
        const newTotalBalance = new Prisma.Decimal(currentCredit + amount);

        // 3. Update the User's master balance safely
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                storeCredit: {
                    increment: exactAmount
                }
            }
        });

        // 4. Create the Immutable Ledger Entry
        const ledgerRecord = await tx.storeCreditTransaction.create({
            data: {
                userId,
                type,
                amount: exactAmount,
                reason,
                referenceId,
                adminId,
                balanceAfter: newTotalBalance 
            }
        });

        return {
            updatedUser,
            ledgerRecord
        };
    });
}

/**
 * Helper Service to Reserve Credit during Checkout Initialization.
 */
export async function reserveStoreCredit(userId: string, amount: number) {
    if (amount <= 0) throw new Error("Reservation amount must be positive");

    return await prisma.$transaction(async (tx) => {
        // Lock row
        const users: any[] = await tx.$queryRaw`SELECT "storeCredit", "reservedStoreCredit" FROM users WHERE id = ${userId} FOR UPDATE`;
        const user = users[0];
        const availableCredit = parseFloat(user.storeCredit.toString()) - parseFloat(user.reservedStoreCredit.toString());

        if (availableCredit < amount) {
            throw new Error("Insufficient available credit to reserve.");
        }

        return await tx.user.update({
            where: { id: userId },
            data: {
                reservedStoreCredit: { increment: amount },
                reservedCreditUpdatedAt: new Date(),
            }
        });
    });
}

/**
 * Helper Service to Release Reserved Credit abandoned after failure/expiry.
 */
export async function releaseReservedCredit(userId: string, amount: number) {
     if (amount <= 0) throw new Error("Release amount must be positive");
    
     return await prisma.user.update({
         where: { id: userId },
         data: {
             reservedStoreCredit: { decrement: amount }
             // If we drop below zero, the Postgres CHECK constraint will violently reject it for safety.
         }
     });
}
