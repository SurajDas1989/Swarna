import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { sendOrderStatusEmail } from '@/lib/email';

type AdminIdentity = { id: string; email: string | null; role: 'ADMIN' };

async function requireAdmin() {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    const tokenRole = String(user.app_metadata?.role || user.user_metadata?.role || '').toUpperCase();

    if (dbUser?.role === 'ADMIN' || tokenRole === 'ADMIN') {
        return dbUser ?? ({ id: user.id, email: user.email, role: 'ADMIN' } as AdminIdentity);
    }

    return null;
}

function getOutOfStockSinceUpdate(nextStock: number) {
    return nextStock > 0 ? null : new Date();
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, deliveryUpdate } = body;

        // --- Delivery-only update (no status change) ---
        // Updates order-level delivery fields.
        // Optionally also updates the user profile if updateUserProfile=true (telecaller confirms it's the customer's own address).
        if (deliveryUpdate && !status) {
            const orderData = {
                guestFirstName: deliveryUpdate.firstName ?? undefined,
                guestLastName:  deliveryUpdate.lastName  ?? undefined,
                guestPhone:     deliveryUpdate.phone     ?? undefined,
                guestAddress:   deliveryUpdate.address   ?? undefined,
                notes:          deliveryUpdate.notes     ?? undefined,
            };

            const updated = await prisma.$transaction(async (tx) => {
                const order = await tx.order.update({
                    where: { id },
                    data: orderData,
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, address: true } },
                        items: { include: { product: { select: { name: true, images: true } } } }
                    }
                });

                // Optionally sync to user profile (telecaller checks this for the customer's own address, not a gift)
                if (deliveryUpdate.updateUserProfile && order.userId) {
                    await tx.user.update({
                        where: { id: order.userId },
                        data: {
                            ...(deliveryUpdate.phone   ? { phone: deliveryUpdate.phone }     : {}),
                            ...(deliveryUpdate.address ? { address: deliveryUpdate.address } : {}),
                        },
                    });
                }

                return order;
            });

            return NextResponse.json(updated);
        }

        // --- Status update (with optional delivery update) ---
        const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAID'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const existingOrder = await prisma.order.findUnique({
            where: { id },
            include: {
                user: true,
                items: {
                    select: {
                        productId: true,
                        quantity: true,
                    },
                },
            },
        });

        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const shouldRestock =
            existingOrder.status !== 'CANCELLED' &&
            status === 'CANCELLED' &&
            existingOrder.stockAdjusted;

        // Optionally apply delivery fields alongside a status change
        const deliveryData = deliveryUpdate ? {
            guestFirstName: deliveryUpdate.firstName ?? undefined,
            guestLastName:  deliveryUpdate.lastName  ?? undefined,
            guestPhone:     deliveryUpdate.phone     ?? undefined,
            guestAddress:   deliveryUpdate.address   ?? undefined,
            notes:          deliveryUpdate.notes     ?? undefined,
        } : {};

        const order = await prisma.$transaction(async (tx) => {
            if (shouldRestock) {
                for (const item of existingOrder.items) {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { stock: true },
                    });

                    if (!product) continue;

                    const nextStock = product.stock + item.quantity;
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: nextStock,
                            outOfStockSince: getOutOfStockSinceUpdate(nextStock),
                        },
                    });
                }
            }

            return tx.order.update({
                where: { id },
                data: {
                    status,
                    stockAdjusted: shouldRestock ? false : existingOrder.stockAdjusted,
                    ...deliveryData,
                },
                include: { user: true }
            });
        });

        const recipientEmail = order.user?.email || order.guestEmail;
        const customerName = `${order.user?.firstName || order.guestFirstName || 'Customer'} ${order.user?.lastName || order.guestLastName || ''}`.trim();

        if (recipientEmail) {
            try {
                await sendOrderStatusEmail(
                    order.id,
                    recipientEmail,
                    customerName,
                    status,
                    order.orderNumber,
                    order.createdAt
                );
            } catch (err) {
                console.error('Failed to send order status email:', err);
            }
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}
