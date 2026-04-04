import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAbandonedCartEmail } from '@/lib/email';

export async function GET(request: Request) {
    // Basic security to ensure this is only called by Vercel Cron
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true'; // Allow manual testing via admin param if needed
    
    const authHeader = request.headers.get('authorization');
    if (!isAdmin && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Threshold: Carts updated more than 2 hours ago but less than 24 hours ago
        // 2 hours is the "golden window" for cart recovery
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const abandonedCarts = await prisma.cart.findMany({
            where: {
                updatedAt: {
                    lt: twoHoursAgo,
                    gt: twentyFourHoursAgo,
                },
                abandonedEmailSent: false,
                items: {
                    some: {} // Ensure cart is not empty
                }
            },
            include: {
                user: true,
                items: {
                    include: {
                        product: true
                    }
                }
            },
            take: 20 // Process in small batches
        });

        const results = {
            processed: abandonedCarts.length,
            sent: 0,
            failed: 0,
            skipped: 0
        };

        for (const cart of abandonedCarts) {
            if (!cart.user?.email) {
                results.skipped++;
                continue;
            }

            // check if user has placed an order SINCE this cart was last updated
            // if they have, this cart is "stale" or from a different session
            const recentOrder = await prisma.order.findFirst({
                where: {
                    userId: cart.userId,
                    createdAt: {
                        gt: cart.updatedAt
                    }
                }
            });

            if (recentOrder) {
                // Mark as sent so we don't check it again, effectively silencing it
                await prisma.cart.update({
                    where: { id: cart.id },
                    data: { abandonedEmailSent: true }
                });
                results.skipped++;
                continue;
            }

            const formattedItems = cart.items.map(item => ({
                name: item.product.name,
                price: Number(item.product.price),
                image: item.product.images?.[0] || '',
            }));

            const customerName = cart.user.firstName || 'Valued Customer';
            const cartUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://swarnacollection.in'}/#cart`;

            const emailResult = await sendAbandonedCartEmail(
                cart.user.email,
                customerName,
                formattedItems,
                cartUrl
            );

            if (emailResult.success) {
                await prisma.cart.update({
                    where: { id: cart.id },
                    data: { abandonedEmailSent: true }
                });
                results.sent++;
            } else {
                results.failed++;
            }
        }

        return NextResponse.json({ success: true, ...results });

    } catch (error) {
        console.error('Abandoned cart cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
