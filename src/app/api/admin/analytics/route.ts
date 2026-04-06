import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        
        // Very basic simple admin check for now
        if (!user || (user.user_metadata?.role !== 'ADMIN' && user.app_metadata?.role !== 'ADMIN')) {
            // Wait, we might need a DB role check depending on how the store handles it. 
            // Our app uses the 'role' field on User model mostly but Supabase metadata might be set. 
            // Ideally we check Prisma User role.
            const dbUser = await prisma.user.findUnique({ where: { id: user?.id } });
            if (!dbUser || dbUser.role !== 'ADMIN') {
                 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(endDate, days - 1));

        // 1. Fetch Orders in range to compute KPIs
        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate },
                status: { notIn: ['CANCELLED', 'PENDING'] } // Assuming PENDING hasn't paid yet, adjust if needed
            },
            include: {
                items: { include: { product: true } }
            }
        });

        let grossSales = 0;
        let discounts = 0;
        let returns = 0;
        let shippingCharges = 0;
        let taxes = 0; // if we can estimate tax from price
        let ordersFulfilledCount = 0;

        // Grouping variables for charts
        const salesByDay: Record<string, number> = {};
        const salesByProduct: Record<string, { name: string; sales: number }> = {};
        const customerIds = new Set<string>();

        // Initialize salesByDay with 0 for all days to ensure line chart is continuous
        for (let i = 0; i < days; i++) {
            const dateStr = startOfDay(subDays(endDate, days - 1 - i)).toISOString().split('T')[0];
            salesByDay[dateStr] = 0;
        }

        orders.forEach(order => {
            const orderTotal = Number(order.total);
            const mrpTotal = Number(order.mrpTotal || 0);
            const cpDis = Number(order.couponDiscount || 0);
            const mrpDis = Number(order.discountOnMRP || 0);
            const refAmt = Number(order.refundedAmount || 0);
            const shipAmt = Number(order.shippingAmount || 0);

            grossSales += mrpTotal > 0 ? mrpTotal : orderTotal; 
            discounts += cpDis + mrpDis;
            returns += refAmt;
            shippingCharges += shipAmt;
            
            // Tax estimation (Placeholder 0% for imitation jewelry)
            taxes += 0; 

            if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
                ordersFulfilledCount++;
            }

            if (order.userId) customerIds.add(order.userId);

            const dateStr = startOfDay(new Date(order.createdAt)).toISOString().split('T')[0];
            if (salesByDay[dateStr] !== undefined) {
                salesByDay[dateStr] += orderTotal; // Net sales added to the day
            }

            order.items.forEach(item => {
                const itemTotal = Number(item.price) * item.quantity;
                if (!salesByProduct[item.productId]) {
                    salesByProduct[item.productId] = { name: item.product.name, sales: 0 };
                }
                salesByProduct[item.productId].sales += itemTotal;
            });
        });

        // 2. Fetch Returning Customers Rate
        // Total customers who ordered in this period
        let returningRate = 0;
        if (customerIds.size > 0) {
            // Find how many of these customers have > 1 order TOTAL (not just in period)
            const returningCustomersCount = await prisma.order.groupBy({
                by: ['userId'],
                where: { userId: { in: Array.from(customerIds) }, status: { notIn: ['CANCELLED', 'PENDING'] } },
                _count: { id: true },
                having: { id: { _count: { gt: 1 } } }
            });
            returningRate = (returningCustomersCount.length / customerIds.size) * 100;
        }

        const netSales = grossSales - discounts - returns;
        const totalSales = netSales + shippingCharges + taxes; // Approximate reconciliation
        const aov = orders.length > 0 ? totalSales / orders.length : 0;

        // Transform records into chart arrays
        const chartSalesOverTime = Object.entries(salesByDay).map(([date, total]) => ({
            date,
            total
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const topProducts = Object.values(salesByProduct)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5); // top 5

        return NextResponse.json({
            metrics: {
                grossSales,
                netSales,
                shippingCharges,
                taxes,
                returns,
                discounts,
                totalSales,
                ordersCount: orders.length,
                ordersFulfilledCount,
                aov,
                returningRate
            },
            charts: {
                salesOverTime: chartSalesOverTime,
                topProducts: topProducts
            }
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
