import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';

async function requireAdmin() {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    const tokenRole = String(user.app_metadata?.role || user.user_metadata?.role || '').toUpperCase();

    if (dbUser?.role === 'ADMIN' || tokenRole === 'ADMIN') {
        return dbUser ?? ({ id: user.id, email: user.email, role: 'ADMIN' } as any);
    }

    return null;
}

// GET — All orders (admin only)
export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const orders = await prisma.order.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                items: {
                    include: { product: { select: { name: true, images: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Admin orders error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}


