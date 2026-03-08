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

export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const [totalOrders, totalCustomers, revenueResult, pendingOrders] = await Promise.all([
            prisma.order.count(),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: { not: 'CANCELLED' } },
            }),
            prisma.order.count({ where: { status: 'PENDING' } }),
        ]);

        return NextResponse.json({
            totalOrders,
            totalCustomers,
            totalRevenue: revenueResult._sum.total ?? 0,
            pendingOrders,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}


