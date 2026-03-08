import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function normalizePhone(phone?: string | null) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const orderNumber = body?.orderNumber;
        const phone = normalizePhone(body?.phone);

        if (!orderNumber || !phone) {
            return NextResponse.json(
                { error: 'orderNumber and phone are required' },
                { status: 400 }
            );
        }

        const order = await prisma.order.findFirst({
            where: {
                orderNumber,
                OR: [
                    { guestPhone: phone },
                    { user: { phone } },
                ],
            },
            include: {
                items: {
                    include: {
                        product: { select: { name: true, images: true } },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            orderNumber: order.orderNumber,
            status: order.status,
            createdAt: order.createdAt,
            total: order.total,
            items: order.items.map((item) => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.price,
                image: item.product.images?.[0] || null,
            })),
        });
    } catch (error) {
        console.error('Order tracking lookup failed:', error);
        return NextResponse.json({ error: 'Failed to lookup order' }, { status: 500 });
    }
}
