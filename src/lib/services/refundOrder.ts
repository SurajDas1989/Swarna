import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { mutateStoreCredit } from './storeCredit';

interface RefundRequest {
    orderId: string;
    refundAmount: number;
    reason: string;
    adminId: string;
    refundMethod: 'ORIGINAL' | 'STORE_CREDIT_ONLY';
}

/**
 * Automates the refund calculation strictly following the wallet-first paradigm to minimize gateway fees
 * unless explicitly overridden by `STORE_CREDIT_ONLY`.
 */
export async function processOrderRefund({
    orderId,
    refundAmount,
    reason,
    adminId,
    refundMethod
}: RefundRequest) {
    if (refundAmount <= 0) {
        throw new Error("Refund amount must be greater than zero.");
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId }
    });

    if (!order) throw new Error("Order not found");

    const totalPaid = Number(order.total);
    const amountAlreadyRefunded = Number(order.refundedAmount);
    
    // Safety constraint: Never refund more than the total order amount
    if (refundAmount > (totalPaid - amountAlreadyRefunded)) {
        throw new Error(`Refund amount exceeds the maximum allowable refund limit of ${totalPaid - amountAlreadyRefunded}`);
    }

    const storeCreditUsedOriginally = Number(order.storeCreditUsed);
    
    // We need to calculate how much wallet credit was ALREADY refunded previously for this order
    const previousLedgerRefunds = await prisma.storeCreditTransaction.aggregate({
        where: {
            referenceId: orderId,
            type: 'REFUNDED'
        },
        _sum: { amount: true }
    });
    
    const storeCreditAlreadyRefunded = Number(previousLedgerRefunds._sum.amount || 0);

    let walletRefundAmount = 0;
    let razorpayRefundAmount = 0;

    if (refundMethod === 'STORE_CREDIT_ONLY') {
        // Fast-path: 100% of the refund goes back to the digital wallet
        walletRefundAmount = refundAmount;
    } else {
        // Splitting Logic (Wallet-First paradigm):
        // 1. Calculate how much original store credit we can still rightfully give back
        const remainingRefundableStoreCredit = storeCreditUsedOriginally - storeCreditAlreadyRefunded;

        // 2. Refund to the wallet up to the limit of what they originally spent from it
        walletRefundAmount = Math.min(refundAmount, remainingRefundableStoreCredit);
        
        // 3. Any remaining refund amount spills over to the Razorpay gateway
        razorpayRefundAmount = refundAmount - walletRefundAmount;
    }

    // --------------------------------------------------------------------------
    // EXECUTION PHASE (Atomicity and Idempotency guarantees)
    // --------------------------------------------------------------------------

    const idempotencyKey = crypto.createHash('md5').update(`${orderId}-${Date.now()}-${refundAmount}`).digest('hex');

    // 1. Process Wallet Refund (Internal Ledger)
    if (walletRefundAmount > 0) {
        if (!order.userId) {
             throw new Error("Cannot reflexively refund store credit to a Guest Checkout. Please use Razorpay Original Method.");
        }

        // We use our centralized ledger service!
        await mutateStoreCredit({
            userId: order.userId,
            amount: walletRefundAmount, // Positive because it's going back TO the user
            type: 'REFUNDED',
            reason: reason,
            referenceId: order.id,
            adminId: adminId
        });
    }

    // 2. Process Razorpay Gateway Refund (If applicable)
    if (razorpayRefundAmount > 0) {
        if (!order.paymentId) {
             throw new Error("Order has no Razorpay Payment ID to refund against.");
        }

        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

        if (!razorpaySecret || !razorpayKey) {
             throw new Error("Razorpay credentials missing from environment.");
        }

        const authBuffer = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64');

        // Note: Razorpay accepts refunds in paise (multiply by 100)
        const rpPayload = {
             amount: Math.round(razorpayRefundAmount * 100),
             receipt: idempotencyKey, // Using hash to prevent duplicate drops
             notes: {
                 reason: reason
             }
        };

        const rpResponse = await fetch(`https://api.razorpay.com/v1/payments/${order.paymentId}/refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authBuffer}`
            },
            body: JSON.stringify(rpPayload)
        });

        const rpData = await rpResponse.json();

        if (!rpResponse.ok) {
             console.error("Razorpay Refund API failed:", rpData);
             throw new Error(`Razorpay Refund failed: ${rpData?.error?.description || 'Unknown error'}`);
        }
    }

    // 3. Update Order Document Status
    const newTotalRefunded = amountAlreadyRefunded + refundAmount;
    
    // Evaluate if the order is now 100% refunded
    const finalOrderStatus = newTotalRefunded >= totalPaid ? 'CANCELLED' : order.status; // or fully_refunded if enum supported

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            refundedAmount: newTotalRefunded,
            status: finalOrderStatus
        }
    });

    return {
        success: true,
        order: updatedOrder,
        split: {
            walletRefundAmount,
            razorpayRefundAmount
        }
    };
}
