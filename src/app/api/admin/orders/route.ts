import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/supabase-server';
import { generateUniqueOrderNumber, normalizePhone } from '@/lib/orders';
import { sendOrderReceiptEmail } from '@/lib/email';

type ManualOrderItem = {
    productId: string;
    quantity: number;
    overridePrice?: number | null;
};

type ManualOrderBody = {
    existingCustomerId?: string | null;
    customer: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    items: ManualOrderItem[];
    paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'COD' | 'CUSTOM';
    paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID';
    paidAmount?: number;
    orderStatus?: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    shippingCost?: number;
    discount?: number;
    notes?: string;
    allowOutOfStock?: boolean;
    updateStock?: boolean;
};

async function findReusableCustomer(body: ManualOrderBody) {
    if (body.existingCustomerId) {
        return prisma.user.findUnique({ where: { id: body.existingCustomerId } });
    }

    const email = body.customer.email?.trim().toLowerCase();
    const phone = normalizePhone(body.customer.phone);

    if (email) {
        const byEmail = await prisma.user.findUnique({ where: { email } });
        if (byEmail) return byEmail;
    }

    if (phone) {
        const byPhone = await prisma.user.findFirst({
            where: { phone },
            orderBy: { updatedAt: 'desc' },
        });
        if (byPhone) return byPhone;
    }

    return null;
}

function buildReceiptPaymentMethod(paymentMethod: string) {
    return paymentMethod.toLowerCase().replace(/_/g, '-');
}

export async function GET() {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const orders = await prisma.order.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, email: true, phone: true, address: true } },
                items: {
                    include: { product: { select: { name: true, images: true, stock: true } } },
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

export async function POST(request: Request) {
    try {
        const admin = await requireAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json() as ManualOrderBody;
        const items = Array.isArray(body.items) ? body.items : [];

        if (items.length === 0) {
            return NextResponse.json({ error: 'Add at least one item to create an order.' }, { status: 400 });
        }

        const paymentMethod = body.paymentMethod || 'COD';
        const paymentStatus = body.paymentStatus || 'PENDING';
        const orderStatus = body.orderStatus || 'CONFIRMED';
        const shippingCost = Math.max(0, Number(body.shippingCost || 0));
        const discount = Math.max(0, Number(body.discount || 0));
        const allowOutOfStock = Boolean(body.allowOutOfStock);
        const updateStock = Boolean(body.updateStock);
        const notes = body.notes?.trim() || null;

        const validPaymentMethods = ['CASH', 'BANK_TRANSFER', 'UPI', 'COD', 'CUSTOM'];
        const validPaymentStatuses = ['PENDING', 'PARTIAL', 'PAID'];
        const validOrderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

        if (!validPaymentMethods.includes(paymentMethod)) {
            return NextResponse.json({ error: 'Invalid payment method.' }, { status: 400 });
        }

        if (!validPaymentStatuses.includes(paymentStatus)) {
            return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
        }

        if (!validOrderStatuses.includes(orderStatus)) {
            return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
        }

        const firstName = body.customer.firstName?.trim() || '';
        const lastName = body.customer.lastName?.trim() || '';
        const email = body.customer.email?.trim().toLowerCase() || '';
        const normalizedPhone = normalizePhone(body.customer.phone);
        const address = body.customer.address?.trim() || '';

        if (!firstName) {
            return NextResponse.json({ error: 'Customer first name is required.' }, { status: 400 });
        }

        if (!email && !normalizedPhone && !body.existingCustomerId) {
            return NextResponse.json({ error: 'Email or phone is required to create or reuse a customer.' }, { status: 400 });
        }

        const uniqueProductIds = [...new Set(items.map((item) => item.productId))];
        const products = await prisma.product.findMany({
            where: { id: { in: uniqueProductIds } },
            select: { id: true, name: true, price: true, stock: true, images: true },
        });
        const productMap = new Map(products.map((product) => [product.id, product]));

        if (products.length !== uniqueProductIds.length) {
            return NextResponse.json({ error: 'One or more selected products could not be found.' }, { status: 400 });
        }

        const warnings: string[] = [];
        let subtotal = 0;
        let mrpTotal = 0;

        const normalizedItems = items.map((item) => {
            const product = productMap.get(item.productId)!;
            const quantity = Math.max(1, Math.floor(Number(item.quantity || 1)));
            const basePrice = Number(product.price);
            const finalPrice = item.overridePrice != null
                ? Math.max(0, Number(item.overridePrice))
                : basePrice;

            if (quantity > product.stock) {
                warnings.push(`${product.name} has only ${product.stock} in stock, requested ${quantity}.`);
            }

            subtotal += finalPrice * quantity;
            mrpTotal += basePrice * quantity;

            return {
                productId: item.productId,
                quantity,
                finalPrice,
                product,
            };
        });

        if (warnings.length > 0 && !allowOutOfStock) {
            return NextResponse.json({
                error: 'Some items are out of stock.',
                warnings,
            }, { status: 400 });
        }

        const total = Math.max(0, subtotal + shippingCost - discount);

        let paidAmount = Math.max(0, Number(body.paidAmount || 0));
        if (paymentStatus === 'PAID') {
            paidAmount = total;
        } else if (paymentStatus === 'PENDING') {
            paidAmount = 0;
        } else {
            paidAmount = Math.min(total, paidAmount);
            if (paidAmount <= 0 || paidAmount >= total) {
                return NextResponse.json({ error: 'Partial payments must be greater than 0 and less than the order total.' }, { status: 400 });
            }
        }

        const orderNumber = await generateUniqueOrderNumber();
        const reusableCustomer = await findReusableCustomer(body);

        const order = await prisma.$transaction(async (tx) => {
            let customerId: string | null = reusableCustomer?.id || null;

            if (reusableCustomer) {
                await tx.user.update({
                    where: { id: reusableCustomer.id },
                    data: {
                        firstName: firstName || reusableCustomer.firstName,
                        lastName: lastName || reusableCustomer.lastName,
                        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
                        ...(address ? { address } : {}),
                    },
                });
            } else {
                const createdCustomer = await tx.user.create({
                    data: {
                        email: email || `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@manual.local`,
                        firstName,
                        lastName: lastName || null,
                        phone: normalizedPhone,
                        address: address || null,
                    },
                });
                customerId = createdCustomer.id;
            }

            if (updateStock) {
                for (const item of normalizedItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }
            }

            return tx.order.create({
                data: {
                    userId: customerId,
                    orderNumber,
                    status: orderStatus,
                    paymentMethod,
                    paymentStatus,
                    paidAmount,
                    notes,
                    isManual: true,
                    stockAdjusted: updateStock,
                    allowOutOfStock,
                    guestEmail: email || reusableCustomer?.email || null,
                    guestPhone: normalizedPhone || reusableCustomer?.phone || null,
                    guestFirstName: firstName || reusableCustomer?.firstName || null,
                    guestLastName: lastName || reusableCustomer?.lastName || null,
                    guestAddress: address || reusableCustomer?.address || null,
                    total,
                    mrpTotal,
                    discountOnMRP: Math.max(0, mrpTotal - subtotal),
                    couponDiscount: discount,
                    shippingAmount: shippingCost,
                    storeCreditUsed: 0,
                    razorpayAmount: 0,
                    paymentId: paymentStatus === 'PAID' ? `manual-${paymentMethod.toLowerCase()}-${Date.now()}` : null,
                    items: {
                        create: normalizedItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.finalPrice,
                        })),
                    },
                },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                    items: {
                        include: { product: { select: { name: true, images: true, stock: true } } },
                    },
                },
            });
        });

        const receiptEmail = order.guestEmail || order.user?.email;
        if (receiptEmail) {
            try {
                await sendOrderReceiptEmail({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    createdAt: order.createdAt,
                    total: Number(order.total),
                    items: {
                        items: order.items.map((item) => ({
                            id: item.productId,
                            name: item.product.name,
                            price: Number(item.price),
                            quantity: item.quantity,
                            image: item.product.images[0] || undefined,
                        })),
                        shipping: {
                            firstName: order.guestFirstName,
                            lastName: order.guestLastName,
                            address: order.guestAddress,
                            email: receiptEmail,
                        },
                        billing: {
                            firstName: order.guestFirstName,
                            lastName: order.guestLastName,
                            address: order.guestAddress,
                            email: receiptEmail,
                        },
                        paymentMethod: buildReceiptPaymentMethod(paymentMethod),
                        summary: {
                            mrpTotal,
                            discountOnMRP: Math.max(0, mrpTotal - subtotal),
                            couponDiscount: discount,
                            storeCreditUsed: 0,
                            subtotal,
                            shipping: shippingCost,
                            taxes: 0,
                            saved: Math.max(0, mrpTotal - subtotal) + discount,
                        },
                    },
                }, receiptEmail);
            } catch (error) {
                console.error('Failed to send manual order receipt email:', error);
            }
        }

        return NextResponse.json({ order, warnings }, { status: 201 });
    } catch (error) {
        console.error('Failed to create admin order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
