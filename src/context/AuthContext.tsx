"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    dbUser: any | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [dbUser, setDbUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    const syncUserToDb = async (currentUser: User | null) => {
        if (!currentUser?.email) return;

        try {
            const res = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentUser.id,
                    email: currentUser.email,
                    fullName: currentUser.user_metadata?.full_name || '',
                    phone: currentUser.phone || currentUser.user_metadata?.phone || '',
                }),
            });
            
            if (res.ok) {
                const data = await res.json();
                setDbUser(data);
            }
        } catch (error) {
            console.error('Failed to sync auth user to DB', error);
        }
    };

    useEffect(() => {
        const setData = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Failed to get auth session', error);
                    setSession(null);
                    setUser(null);
                    setDbUser(null);
                    return;
                }

                setSession(session);
                setUser(session?.user || null);
                
                // Keep initial render unblocked even if sync API is slow/failing.
                if (session?.user) {
                    syncUserToDb(session.user);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Unexpected auth session error', error);
                setSession(null);
                setUser(null);
                setDbUser(null);
                setLoading(false);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user || null);
            
            if (_event === 'SIGNED_OUT') {
                setDbUser(null);
                setLoading(false);
            } else if ((_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') && session?.user) {
                await syncUserToDb(session.user);
                setLoading(false);
            } else {
                setLoading(false);
            }
        });

        setData();
// ... rest of the inactivity logic remains the same

        // --- Auto Logout Logic ---
        const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
        let inactivityTimer: NodeJS.Timeout;

        const resetTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                // Log out after 10 minutes of inactivity if user is logged in
                supabase.auth.getSession().then(({ data }) => {
                    if (data.session) {
                        console.log("Logging out due to inactivity");
                        supabase.auth.signOut().then(() => {
                            window.location.href = '/'; // Force reload/redirect to clear state safely
                        });
                    }
                });
            }, INACTIVITY_LIMIT);
        };

        const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart'];

        const attachEventListeners = () => {
            activityEvents.forEach(event => window.addEventListener(event, resetTimer));
            resetTimer(); // Initialize timer
        };

        const detachEventListeners = () => {
            activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
            if (inactivityTimer) clearTimeout(inactivityTimer);
        };

        attachEventListeners();

        return () => {
            subscription.unsubscribe();
            detachEventListeners();
        };
    }, [supabase.auth]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{ user, session, dbUser, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};



