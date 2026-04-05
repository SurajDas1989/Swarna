"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to send reset link.');
            } else {
                setSuccess(true);
            }
        } catch (err: any) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md">
                {/* Premium Card */}
                <div className="bg-white dark:bg-card rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">
                    {/* Gold Accent Line */}
                    <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

                    {/* Header */}
                    <div className="text-center pt-10 pb-2 px-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Reset Password</h1>
                        <p className="text-gray-500 mt-2 text-sm">Enter your email address to receive a secure password reset link.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-8 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success ? (
                        <div className="p-8 space-y-6 text-center">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Check your inbox</h3>
                                <p className="text-gray-500 text-sm">
                                    We have sent a secure password reset link to <strong>{email}</strong>. Please check your spam folder if you do not see it within a few minutes.
                                </p>
                            </div>
                            <Link href="/login" className="block w-full bg-gray-900 dark:bg-primary text-white dark:text-background py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 dark:hover:bg-primary-dark transition-all shadow-lg">
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleResetPassword} className="p-8 space-y-5">
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
                                        Send Reset Link
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>

                            {/* Back to Login Link */}
                            <p className="text-center text-sm text-gray-500 pt-2">
                                Remember your password?{' '}
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
