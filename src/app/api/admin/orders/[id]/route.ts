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
        const { status } = await request.json();

        const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const order = await prisma.order.update({
            where: { id },
            data: { status },
            include: { user: true }
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

