import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { createServerClient } from '@supabase/ssr';

// Create a new ratelimiter, that allows 100 requests per 10 seconds
const ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(100, '10 s'),
    analytics: true,
});

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Only apply rate limiting to auth routes and API routes
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup') ||
        request.nextUrl.pathname.startsWith('/forgot-password');
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isPublicAsset = request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.match(/\.(.*)$/) ||
        request.nextUrl.pathname === '/favicon.ico';

    // --- Strict Admin Isolation Logic ---
    if (!isApiRoute && !isPublicAsset) {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // First check JWT metadata (fast)
            let role = String(user.app_metadata?.role || user.user_metadata?.role || '').toUpperCase();
            
            // If role not in metadata, check database (robust)
            if (!role) {
                const { data: dbUser } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                
                if (dbUser?.role) {
                    role = dbUser.role.toUpperCase();
                }
            }

            const isAdminOrStaff = role === 'ADMIN' || role === 'STAFF';

            // If an Admin/Staff tries to access the storefront (anything NOT /admin and NOT public auth pages), redirect to /admin
            if (isAdminOrStaff && !isAdminRoute && !isAuthRoute) {
                const url = request.nextUrl.clone();
                url.pathname = '/admin';
                return NextResponse.redirect(url);
            }

            // Optional: If a regular user tries to access /admin, kick them to home (redundant but safe)
            if (!isAdminOrStaff && isAdminRoute) {
                const url = request.nextUrl.clone();
                url.pathname = '/';
                return NextResponse.redirect(url);
            }
        }
    }

    // --- Rate Limiting Logic ---
    if (isAuthRoute || isApiRoute) {
        // Skip rate limiting outside production
        if (process.env.NODE_ENV === 'production' && process.env.KV_REST_API_TOKEN) {
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
            try {
                const { success, limit, reset, remaining } = await ratelimit.limit(`ratelimit_${ip}`);
                if (!success) {
                    return NextResponse.json({ error: 'Too Many Requests' }, {
                        status: 429,
                        headers: {
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString(),
                        },
                    });
                }
                response.headers.set('X-RateLimit-Limit', limit.toString());
                response.headers.set('X-RateLimit-Remaining', remaining.toString());
                response.headers.set('X-RateLimit-Reset', reset.toString());
            } catch (error) {
                console.error('Rate limit error:', error);
            }
        }
    }

    return response;
}

// Matching Paths
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|images/).*)',
    ],
};
