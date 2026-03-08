import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// GET - Fetch user's wishlist
export async function GET() {
    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: authUser.email },
            include: {
                wishlist: {
                    select: { id: true }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const wishlistedProductIds = user.wishlist.map(p => p.id);
        return NextResponse.json(wishlistedProductIds);
    } catch (error) {
        console.error('Fetch wishlist error:', error);
        return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }
}

// POST - Add product to wishlist
export async function POST(request: Request) {
    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { email: authUser.email },
            data: {
                wishlist: {
                    connect: { id: productId }
                }
            },
            include: {
                wishlist: {
                    select: { id: true }
                }
            }
        });

        const wishlistedProductIds = user.wishlist.map(p => p.id);
        return NextResponse.json(wishlistedProductIds);
    } catch (error) {
        console.error('Add to wishlist error:', error);
        return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
    }
}

// DELETE - Remove product from wishlist
export async function DELETE(request: Request) {
    try {
        const authUser = await getAuthenticatedUser();
        if (!authUser || !authUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { email: authUser.email },
            data: {
                wishlist: {
                    disconnect: { id: productId }
                }
            },
            include: {
                wishlist: {
                    select: { id: true }
                }
            }
        });

        const wishlistedProductIds = user.wishlist.map(p => p.id);
        return NextResponse.json(wishlistedProductIds);
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
    }
}
