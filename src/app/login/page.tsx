"use client";

import { useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    // Get redirect URL or default to home
    const redirectUrl = searchParams.get('redirect') || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                // Quick check for admin status to decide direct redirect
                const { data: { user: signedInUser } } = await supabase.auth.getUser();
                
                // If the user has an admin role in metadata or if they were heading to admin anyway
                const isAdmin = signedInUser?.app_metadata?.role === 'ADMIN' || 
                                signedInUser?.user_metadata?.role === 'ADMIN';

                if (isAdmin && redirectUrl === '/') {
                    router.push('/admin');
                } else {
                    router.push(redirectUrl);
                }
                router.refresh();
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
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground" style={{ fontFamily: 'Georgia, serif' }}>Welcome Back</h1>
                        <p className="text-gray-500 mt-2 text-sm">Enter your credentials to access your account</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleLogin} className="p-8 space-y-5">
                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
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
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                                <Link href="/forgot-password" className="text-xs text-amber-600 hover:underline font-medium">Forgot password?</Link>
                            </div>
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
                                    Sign In
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>

                        {/* Sign Up Link */}
                        <p className="text-center text-sm text-gray-500 pt-2">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-amber-600 font-semibold hover:underline">
                                Sign Up
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <LoginForm />
        </Suspense>
    );
}
