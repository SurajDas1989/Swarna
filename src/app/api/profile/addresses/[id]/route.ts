import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { label, fullName, phone, addressLine1, addressLine2, landmark, city, state, pincode, isDefault } = body;

        // Verify ownership
        const existingAddress = await prisma.address.findUnique({
            where: { id },
        });

        if (!existingAddress || existingAddress.userId !== user.id) {
             return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 403 });
        }

        const updatedAddress = await prisma.$transaction(async (tx) => {
            if (isDefault && !existingAddress.isDefault) {
                 // Unset other defaults
                 await tx.address.updateMany({
                     where: { userId: user.id, isDefault: true, id: { not: id } },
                     data: { isDefault: false },
                 });
            }

            return tx.address.update({
                where: { id },
                data: {
                    label: label !== undefined ? label : existingAddress.label,
                    fullName: fullName !== undefined ? fullName : existingAddress.fullName,
                    phone: phone !== undefined ? phone : existingAddress.phone,
                    addressLine1: addressLine1 !== undefined ? addressLine1 : existingAddress.addressLine1,
                    addressLine2: addressLine2 !== undefined ? addressLine2 : existingAddress.addressLine2,
                    landmark: landmark !== undefined ? landmark : existingAddress.landmark,
                    city: city !== undefined ? city : existingAddress.city,
                    state: state !== undefined ? state : existingAddress.state,
                    pincode: pincode !== undefined ? pincode : existingAddress.pincode,
                    isDefault: isDefault !== undefined ? isDefault : existingAddress.isDefault,
                },
            });
        });

        return NextResponse.json(updatedAddress);
    } catch (error) {
        console.error('Failed to update address:', error);
        return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const existingAddress = await prisma.address.findUnique({
            where: { id },
        });

        if (!existingAddress || existingAddress.userId !== user.id) {
             return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
             await tx.address.delete({
                 where: { id },
             });

             // If we deleted the default address, and there are other addresses, make the newest one default
             if (existingAddress.isDefault) {
                 const newestAddress = await tx.address.findFirst({
                     where: { userId: user.id },
                     orderBy: { createdAt: 'desc' },
                 });

                 if (newestAddress) {
                     await tx.address.update({
                         where: { id: newestAddress.id },
                         data: { isDefault: true },
                     });
                 }
             }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete address:', error);
        return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
    }
}
