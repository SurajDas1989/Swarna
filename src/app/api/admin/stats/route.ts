import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/supabase-server';

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
            prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
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

