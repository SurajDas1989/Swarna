import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { sendResetPasswordEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabaseAdmin = createServiceRoleSupabaseClient();
        if (!supabaseAdmin) {
            console.error('Supabase admin client not initialized');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Determine the redirect origin. 
        // We prioritize the configured APP_URL for production consistency.
        const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.swarnacollection.in';
        const redirectTo = `${siteUrl.replace(/\/$/, '')}/reset-password`;

        // Generate a recovery link using Supabase Admin
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: redirectTo,
            },
        });

        if (error) {
            console.error('Error generating reset link:', error);
            // We return 200 even on error for security (don't reveal if email exists)
            // unless it's a specific rate limit or platform error
            return NextResponse.json({ 
                success: true, 
                message: 'If an account exists, a reset link has been sent.' 
            });
        }

        if (data?.properties?.action_link) {
            // Send the custom branded email
            const emailResult = await sendResetPasswordEmail(email, data.properties.action_link);
            
            if (!emailResult.success) {
                console.error('Failed to send reset email:', emailResult.error);
                return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'If an account exists, a reset link has been sent.'
        });

    } catch (error: any) {
        console.error('Forgot password API error:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
