import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { sendOrderReceiptEmail } from '@/lib/email';

interface CheckoutItem {
    id: string;
    quantity: number;
    price: number;
}

function createOrderNumber() {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const shortHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SW-${datePart}-${shortHash}`;
}

function normalizePhone(phone?: string | null) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    return digits.length > 10 ? digits.slice(-10) : digits;
}

async function generateUniqueOrderNumber() {
    for (let i = 0; i < 5; i++) {
        const candidate = createOrderNumber();
        const existing = await prisma.order.findUnique({ where: { orderNumber: candidate } });
        if (!existing) return candidate;
    }
    return `${createOrderNumber()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
}

// POST - Create a new order (supports guest and logged-in checkout)
export async function POST(request: Request) {
    try {
        const authUser = await getAuthenticatedUser();

        const body = await request.json();
        const { items, total, shipping, paymentMethod, useStoreCredit } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        if (!shipping?.firstName || !shipping?.lastName || !shipping?.email || !shipping?.phone || !shipping?.address || !shipping?.city || !shipping?.state || !shipping?.pincode) {
            return NextResponse.json({ error: 'Missing shipping details' }, { status: 400 });
        }

        const normalizedPhone = normalizePhone(shipping.phone);
        if (!normalizedPhone) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }

        const formattedAddress = `${shipping.address}\n${shipping.city}, ${shipping.state} ${shipping.pincode}`;
        const orderNumber = await generateUniqueOrderNumber();

        let dbUserId: string | null = null;
        let receiptEmail = shipping.email as string;

        if (authUser?.email) {
            const finalFirstName = shipping.firstName || authUser.user_metadata?.full_name?.split(' ')[0] || '';
            const finalLastName = shipping.lastName || authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';

            const dbUser = await prisma.user.upsert({
                where: { email: authUser.email },
                update: {
                    firstName: finalFirstName,
                    lastName: finalLastName,
                    phone: normalizedPhone,
                    address: formattedAddress,
                },
                create: {
                    id: authUser.id,
                    email: authUser.email,
                    firstName: finalFirstName,
                    lastName: finalLastName,
                    phone: normalizedPhone,
                    address: formattedAddress,
                },
            });

            dbUserId = dbUser.id;
            receiptEmail = dbUser.email;
        }

        // Ensure atomic completion of store credit usages to prevent double-spending
        const orderResult = await prisma.$transaction(async (tx) => {
            let finalCreditUsed = 0;
            let finalOrderStatus = 'PENDING';
            let checkoutTotal = parseFloat(total);

            // Fetch the most real-time user credit state from DB, NEVER trust the client
            if (useStoreCredit && dbUserId) {
                 const currentUser = await tx.user.findUnique({ where: { id: dbUserId }});
                 if (currentUser && Number(currentUser.storeCredit) > 0) {
                     const userCredit = Number(currentUser.storeCredit);
                     
                     if (userCredit >= checkoutTotal) {
                         // Full Coverage: Credit covers the entire order
                         finalCreditUsed = checkoutTotal;
                         finalOrderStatus = 'PAID'; // Paid instantly via credit
                     } else {
                         // Partial Coverage: Credit covers part of it, Razorpay handles the rest
                         finalCreditUsed = userCredit;
                     }

                     // Deduct the used credit immediately
                     await tx.user.update({
                         where: { id: dbUserId },
                         data: { storeCredit: { decrement: finalCreditUsed } }
                     });

                     await tx.storeCreditTransaction.create({
                         data: {
                             userId: dbUserId,
                             amount: -finalCreditUsed, // negative for usage
                             reason: `Purchased used for Order ${orderNumber}`
                         }
                     });
                 }
            }

            return await tx.order.create({
                data: {
                    userId: dbUserId,
                    guestEmail: dbUserId ? null : shipping.email,
                    guestPhone: dbUserId ? null : normalizedPhone,
                    guestFirstName: dbUserId ? null : shipping.firstName,
                    guestLastName: dbUserId ? null : shipping.lastName,
                    guestAddress: dbUserId ? null : formattedAddress,
                    orderNumber,
                    total, // Keep original total
                    storeCreditUsed: finalCreditUsed, // How much of it was credit
                    status: finalOrderStatus as any,
                    items: {
                        create: (items as CheckoutItem[]).map((item) => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                },
                include: { items: { include: { product: true } } },
            });
        });

        const order = orderResult;

        if (paymentMethod === 'cod') {
            await prisma.order.update({
                where: { id: order.id },
                data: { paymentId: 'cod' },
            });

            const emailItems = order.items.map((i) => ({
                id: i.productId,
                name: i.product.name,
                price: Number(i.price),
                quantity: i.quantity,
                image: i.product.images?.[0] || undefined,
            }));

            const subtotal = emailItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            const emailOrder = {
                id: order.id,
                orderNumber: order.orderNumber,
                createdAt: order.createdAt,
                total: Number(order.total),
                items: {
                    items: emailItems,
                    shipping,
                    billing: shipping,
                    paymentMethod: 'cod',
                    summary: {
                        subtotal,
                        discount: 0,
                        shipping: 0,
                        taxes: 0,
                        saved: 0,
                    },
                },
            };

            try {
                await sendOrderReceiptEmail(emailOrder, receiptEmail);
            } catch (emailError) {
                console.error('Failed to send COD receipt email:', emailError);
            }
        }

        return NextResponse.json(order, { status: 201 });
    } catch (error: unknown) {
        console.error('Failed to create order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}

// GET - Fetch logged-in user's order history
export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'You must be logged in to view orders' },
                { status: 401 }
            );
        }

        const dbUser = await prisma.user.findFirst({
            where: {
                OR: [{ id: user.id }, { email: user.email! }],
            },
        });

        if (!dbUser) {
            return NextResponse.json([]);
        }

        const orders = await prisma.order.findMany({
            where: { userId: dbUser.id },
            include: {
                items: {
                    include: { product: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(orders);
    } catch (error: unknown) {
        console.error('Failed to fetch orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}



