"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                    emailRedirectTo: `${window.location.origin}/`,
                },
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
            }
        } catch (err: any) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70dvh] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                {/* Premium Card */}
                <div className="bg-white dark:bg-card rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                    {/* Gold Accent Line */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

                    {/* Header */}
                    <div className="text-center pt-10 pb-2 px-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Create Account</h1>
                        <p className="text-gray-500 mt-2 text-sm">Join Swarna and start your luxurious journey</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}
                    
                    {!success && (
                        <div className="px-8 pt-8">
                            {/* Google Auth Button */}
                            <button
                                type="button"
                                onClick={async () => {
                                    setLoading(true);
                                    setError('');
                                    try {
                                        const { error } = await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: {
                                                redirectTo: `${window.location.origin}/api/auth/callback`,
                                            },
                                        });
                                        if (error) throw error;
                                    } catch (err: any) {
                                        setError('Failed to initialize Google signup');
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-card border border-gray-200 dark:border-white/10 text-gray-700 dark:text-foreground py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continue with Google
                            </button>
                            
                            <div className="relative mt-8 mb-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white dark:bg-card px-4 text-gray-500 text-xs font-semibold uppercase tracking-wider">Or continue with email</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message / Next Steps */}
                    {success ? (
                        <div className="p-8 space-y-6 text-center">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Verify your email</h3>
                                <p className="text-gray-500 text-sm">
                                    We've sent a secure verification link to <strong>{email}</strong>. Please click the link to activate your Swarna Collection account.
                                </p>
                            </div>
                            <Link href="/login" className="block w-full bg-gray-900 dark:bg-primary text-white dark:text-background py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 dark:hover:bg-primary-dark transition-all shadow-lg">
                                Back to Login
                            </Link>
                        </div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleSignup} className="p-8 pt-4 space-y-5">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/15 dark:bg-white/5 dark:text-foreground text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/15 dark:bg-white/5 dark:text-foreground text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/15 dark:bg-white/5 dark:text-foreground text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-primary text-white dark:text-background py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 dark:hover:bg-primary-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg mt-2"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Register Now
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>

                            {/* Login Link */}
                            <p className="text-center text-sm text-gray-500 pt-2">
                                Already have an account?{' '}
                                <Link href="/login" className="text-amber-600 font-semibold hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
