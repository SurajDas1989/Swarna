"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // Check if the user is actually in a recovery session
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                // If they just navigated here directly without clicking the email link
                // or the link expired, they don't have a recovery session.
                setError("Invalid or expired password reset link. Please request a new one.");
            }
        };
        checkSession();
    }, [supabase]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long");
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                // Optionally log them out so they have to sign in with the new password
                await supabase.auth.signOut();
            }
        } catch (err: any) {
            setError('An unexpected error occurred. Please try again.');
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
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground" style={{ fontFamily: 'Georgia, serif' }}>Set New Password</h1>
                        <p className="text-gray-500 mt-2 text-sm">Please enter a strong, secure password for your account.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-8 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm text-center">
                            {error}
                            {error.includes("expired") && (
                                <div className="mt-2">
                                    <Link href="/forgot-password" className="text-xs font-bold underline hover:text-red-800 dark:hover:text-red-300">Request a new link</Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Success Message */}
                    {success ? (
                        <div className="p-8 space-y-6 text-center">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-foreground mb-2">Password Updated!</h3>
                                <p className="text-gray-500 text-sm">
                                    Your password has been successfully reset. You can now use your new password to log in to your account.
                                </p>
                            </div>
                            <Link href="/login" className="block w-full bg-gray-900 dark:bg-primary text-white dark:text-background py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 dark:hover:bg-primary-dark transition-all shadow-lg">
                                Return to Login
                            </Link>
                        </div>
                    ) : (
                        /* Form */
                        <form onSubmit={handleUpdatePassword} className="p-8 space-y-5">
                            {/* New Password */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">New Password</label>
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
                                        disabled={error.includes("expired")}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/15 dark:bg-white/5 dark:text-foreground text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 transition-all"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={error.includes("expired")}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || error.includes("expired")}
                                className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-primary text-white dark:text-background py-3.5 rounded-xl text-base font-semibold hover:bg-gray-800 dark:hover:bg-primary-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg mt-2"
                            >
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        Update Password
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
