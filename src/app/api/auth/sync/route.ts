import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';

function normalizePhone(phone?: string | null) {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    return digits.length > 10 ? digits.slice(-10) : digits;
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { email, fullName, phone } = await request.json();

        if (email !== user.email) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        const normalizedPhone = normalizePhone(phone || user.phone || user.user_metadata?.phone || null);

        const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
                firstName: fullName?.split(' ')[0] || '',
                lastName: fullName?.split(' ').slice(1).join(' ') || '',
                ...(normalizedPhone ? { phone: normalizedPhone } : {}),
            },
            create: {
                id: user.id,
                email,
                firstName: fullName?.split(' ')[0] || '',
                lastName: fullName?.split(' ').slice(1).join(' ') || '',
                phone: normalizedPhone,
            },
        });

        const linkConditions: Array<{ guestEmail?: { equals: string; mode: 'insensitive' }; guestPhone?: string }> = [
            { guestEmail: { equals: email, mode: 'insensitive' } },
        ];

        if (normalizedPhone) {
            linkConditions.push({ guestPhone: normalizedPhone });
        }

        await prisma.order.updateMany({
            where: {
                userId: null,
                OR: linkConditions,
            },
            data: { userId: dbUser.id },
        });

        return NextResponse.json(dbUser);
    } catch (error: unknown) {
        console.error('Failed to sync user:', error);
        return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
    }
}

