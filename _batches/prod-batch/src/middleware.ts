import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Create a new ratelimiter, that allows 100 requests per 10 seconds
const ratelimit = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(100, '10 s'),
    analytics: true,
});

export async function middleware(request: NextRequest) {
    // Only apply rate limiting to auth routes and API routes
    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup') ||
        request.nextUrl.pathname.startsWith('/forgot-password');
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

    // We don't want to rate limit public assets or the main website browsing
    if (!isAuthRoute && !isApiRoute) {
        return NextResponse.next();
    }

    // Skip rate limiting outside production to avoid local/dev hangs from external KV calls.
    if (process.env.NODE_ENV !== 'production') {
        return NextResponse.next();
    }

    // In production, skip if KV token is not configured.
    if (!process.env.KV_REST_API_TOKEN) {
        return NextResponse.next();
    }

    // Determine the IP address of the client
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    try {
        const { success, limit, reset, remaining } = await ratelimit.limit(
            `ratelimit_${ip}`
        );

        const response = success
            ? NextResponse.next()
            : NextResponse.json({ error: 'Too Many Requests. Please try again later.' }, {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': reset.toString(),
                },
            });

        // Add rate limit info to successful responses too
        if (success) {
            response.headers.set('X-RateLimit-Limit', limit.toString());
            response.headers.set('X-RateLimit-Remaining', remaining.toString());
            response.headers.set('X-RateLimit-Reset', reset.toString());
        }

        return response;
    } catch (error) {
        // If Redis fails, let the request pass instead of bringing down the site
        console.error('Rate limit error:', error);
        return NextResponse.next();
    }
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images/ (public images folder)
         */
        '/((?!_next/static|_next/image|favicon.ico|images/).*)',
    ],
};
