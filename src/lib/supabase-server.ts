import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function createServerSupabaseClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server component — can't set cookies
                    }
                },
            },
        }
    );
}

/**
 * Validates the current user session on the server side.
 * Returns the authenticated user or null if not logged in.
 * Use this in API routes to protect endpoints.
 */
export async function getAuthenticatedUser() {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

/**
 * Validates that the current user is an admin.
 * Checks both the JWT metadata and the database record.
 * Returns the user object if they are an admin, otherwise null.
 */
export async function requireAdmin() {
    const user = await getAuthenticatedUser();
    if (!user) return null;

    const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
    const tokenRole = String(user.app_metadata?.role || user.user_metadata?.role || '').toUpperCase();

    if (dbUser?.role === 'ADMIN' || tokenRole === 'ADMIN') {
        return dbUser ?? ({ id: user.id, email: user.email, role: 'ADMIN' } as any);
    }

    return null;
}

