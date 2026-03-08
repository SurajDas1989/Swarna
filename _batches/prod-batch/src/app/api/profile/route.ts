import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/supabase-server';

// GET - Fetch user profile (PROTECTED)
export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'You must be logged in to view your profile' },
                { status: 401 }
            );
        }

        let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
        });

        // Auto-create user in DB if they signed up via Supabase but weren't synced yet
        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email!,
                    firstName: user.user_metadata?.full_name?.split(' ')[0] || '',
                    lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                },
            });
        }

        return NextResponse.json(dbUser);
    } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// PUT - Update user profile (PROTECTED)
export async function PUT(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json(
                { error: 'You must be logged in to update your profile' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { firstName, lastName, phone, address } = body;

        const dbUser = await prisma.user.upsert({
            where: { email: user.email! },
            update: { firstName, lastName, phone, address },
            create: {
                id: user.id,
                email: user.email!,
                firstName,
                lastName,
                phone,
                address,
            },
        });

        return NextResponse.json(dbUser);
    } catch (error: any) {
        console.error('Failed to update profile:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
