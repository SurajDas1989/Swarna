import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminOrStaff } from '@/lib/supabase-server';

export async function GET() {
    try {
        const user = await requireAdminOrStaff();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const isStaff = user.role === 'STAFF';

        const [totalOrders, totalCustomers, revenueResult, pendingOrders] = await Promise.all([
            prisma.order.count(),
            prisma.user.count({ where: { role: 'CUSTOMER' } }),
            isStaff ? Promise.resolve({ _sum: { total: 0 } }) : prisma.order.aggregate({
                _sum: { total: true },
                where: { status: { not: 'CANCELLED' } },
            }),
            prisma.order.count({ where: { status: { in: ['PENDING', 'CONFIRMED'] } } }),
        ]);

        return NextResponse.json({
            totalOrders,
            totalCustomers,
            totalRevenue: isStaff ? 0 : (revenueResult._sum.total ?? 0),
            pendingOrders,
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}

