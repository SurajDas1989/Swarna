import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const addresses = await prisma.address.findMany({
            where: { userId: user.id },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });

        return NextResponse.json(addresses);
    } catch (error) {
        console.error('Failed to fetch addresses:', error);
        return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { label, fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, isDefault } = body;

        if (!fullName || !phone || !addressLine1) {
            return NextResponse.json({ error: 'Full name, phone, and address line 1 are required.' }, { status: 400 });
        }

        const isFirstAddress = await prisma.address.count({ where: { userId: user.id } }) === 0;
        const setAsDefault = isFirstAddress || isDefault;

        const newAddress = await prisma.$transaction(async (tx) => {
            if (setAsDefault) {
                // Unset existing defaults
                await tx.address.updateMany({
                    where: { userId: user.id, isDefault: true },
                    data: { isDefault: false },
                });
            }

            return tx.address.create({
                data: {
                    userId: user.id,
                    label,
                    fullName,
                    phone,
                    addressLine1,
                    addressLine2,
                    landmark,
                    city,
                    state,
                    pincode,
                    isDefault: setAsDefault,
                },
            });
        });

        return NextResponse.json(newAddress, { status: 201 });
    } catch (error) {
        console.error('Failed to create address:', error);
        return NextResponse.json({ error: 'Failed to create address' }, { status: 500 });
    }
}
