import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    const next = searchParams.get('next') ?? '/reset-password';

    if (token_hash && type === 'recovery') {
        const supabase = await createServerSupabaseClient();
        
        const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash,
        });
        
        if (!error) {
            // Successfully established session, now redirect to the frontend page
            return NextResponse.redirect(`${origin}${next}`);
        }
        
        console.error("verifyOtp error during password reset:", error);
    }

    // return the user to login with an error message
    return NextResponse.redirect(`${origin}/login?error=Invalid or expired recovery link`);
}
