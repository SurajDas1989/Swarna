import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';

function mergeCartItems<T extends { productId: string; quantity: number }>(items: T[]) {
    const merged = new Map<string, T>();

    for (const item of items) {
        const existing = merged.get(item.productId);
        if (!existing) {
            merged.set(item.productId, { ...item });
            continue;
        }

        merged.set(item.productId, {
            ...existing,
            quantity: existing.quantity + item.quantity,
        });
    }

    return Array.from(merged.values());
}

export async function GET() {
    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email },
            include: {
                cart: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!user || !user.cart) {
            return NextResponse.json([]);
        }

        // Format for the frontend context
        const mergedItems = mergeCartItems(user.cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            product: item.product,
        })));

        const formattedCart = mergedItems.map(item => ({
            ...item.product,
            quantity: item.quantity
        }));

        return NextResponse.json(formattedCart);
    } catch (error) {
        console.error('Fetch cart error:', error);
        return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { cartItems } = await request.json();

        if (!Array.isArray(cartItems)) {
            return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 });
        }

        const mergedIncomingCart = mergeCartItems(
            cartItems
                .filter((item) => item && typeof item.id === 'string' && Number(item.quantity) > 0)
                .map((item) => ({
                    productId: item.id,
                    quantity: Math.max(1, Math.floor(Number(item.quantity))),
                }))
        );

        const user = await prisma.user.findUnique({
            where: { email: authUser.email },
            include: { cart: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If they have an existing cart, delete all current items to replace them with the new synced state
        if (user.cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: user.cart.id }
            });

            // If the cart is now empty, just return
            if (mergedIncomingCart.length === 0) {
                return NextResponse.json({ success: true });
            }

            // Insert new items
            await prisma.cartItem.createMany({
                data: mergedIncomingCart.map(item => ({
                    cartId: user.cart!.id,
                    productId: item.productId,
                    quantity: item.quantity
                }))
            });

            // Reset abandoned email flag since they just updated their cart!
            await prisma.cart.update({
                where: { id: user.cart.id },
                data: { abandonedEmailSent: false }
            });

        } else {
            // Create a brand new cart if they don't have one
            if (mergedIncomingCart.length > 0) {
                await prisma.cart.create({
                    data: {
                        userId: user.id,
                        items: {
                            create: mergedIncomingCart.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity
                            }))
                        }
                    }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sync cart error:', error);
        return NextResponse.json({ error: 'Failed to sync cart' }, { status: 500 });
    }
}
