import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendOrderReceiptEmail } from '@/lib/email';
import { mutateStoreCredit } from '@/lib/services/storeCredit';

export async function POST(request: Request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        } = await request.json();

        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const generatedSignature = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            console.error('Invalid Razorpay signature');
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PAID',
                razorpayOrderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
            },
            include: { user: true },
        });

        // If the order had store credit reserved, finalize the deduction now that payment succeeded
        if (updatedOrder.userId && updatedOrder.storeCreditUsed && Number(updatedOrder.storeCreditUsed) > 0) {
            try {
                // This releases the hold and permanently subtracts the spent credit from the ledger.
                // We use our central service so the Ledger record is accurately written.
                await mutateStoreCredit({
                    userId: updatedOrder.userId,
                    amount: -Number(updatedOrder.storeCreditUsed),
                    type: 'SPENT',
                    reason: `Purchased used for Order SW-${updatedOrder.id.substring(0, 5)}...`,
                    referenceId: updatedOrder.id
                });
            } catch (err) {
                 console.error("Critical Error: Failed to finalize store credit deduction after Razorpay success.", err);
                 // We don't block the checkout success response here, but this needs logging/alerting
            }
        }

        const orderWithDetails = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { product: true } }, user: true },
        });

        if (orderWithDetails) {
            const emailItems = orderWithDetails.items.map((i) => ({
                id: i.productId,
                name: i.product.name,
                price: Number(i.price),
                quantity: i.quantity,
                image: i.product.images?.[0] || undefined,
            }));

            const shipping = {
                firstName: orderWithDetails.user?.firstName || orderWithDetails.guestFirstName || 'Customer',
                lastName: orderWithDetails.user?.lastName || orderWithDetails.guestLastName || '',
                address: orderWithDetails.user?.address || orderWithDetails.guestAddress || 'Address not available',
                city: '',
                state: '',
                pincode: '',
                email: orderWithDetails.user?.email || orderWithDetails.guestEmail || undefined,
            };

            const subtotal = emailItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            const emailOrder = {
                id: orderWithDetails.id,
                orderNumber: orderWithDetails.orderNumber,
                createdAt: orderWithDetails.createdAt,
                total: Number(orderWithDetails.total),
                items: {
                    items: emailItems,
                    shipping,
                    billing: shipping,
                    paymentMethod: 'razorpay',
                    summary: {
                        mrpTotal: Number(orderWithDetails.mrpTotal) || subtotal,
                        discountOnMRP: Number(orderWithDetails.discountOnMRP) || 0,
                        couponDiscount: Number(orderWithDetails.couponDiscount) || 0,
                        storeCreditUsed: Number(orderWithDetails.storeCreditUsed) || 0,
                        subtotal,
                        shipping: Number(orderWithDetails.shippingAmount) || 0,
                        taxes: 0,
                        saved: (Number(orderWithDetails.discountOnMRP) || 0) + (Number(orderWithDetails.couponDiscount) || 0),
                    },
                },
            };

            const recipientEmail = orderWithDetails.user?.email || orderWithDetails.guestEmail;
            if (recipientEmail) {
                try {
                    await sendOrderReceiptEmail(emailOrder, recipientEmail);
                } catch (emailError) {
                    console.error('Failed to send Razorpay receipt email:', emailError);
                }
            }
        }

        return NextResponse.json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error('Razorpay verification error:', error);
        return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
}

