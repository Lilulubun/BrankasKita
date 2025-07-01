// src/app/components/AuthProvider/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext<{ session: Session | null }>({ session: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        
        // THIS IS THE CRITICAL FIX:
        // If the user is currently on the /update-password page, we only update
        // the session state but we NEVER redirect them. This allows the
        // update-password page to handle the recovery event itself.
        if (pathname === '/update-password') {
          setSession(currentSession);
          return;
        }

        // --- The rest of the logic runs for all other pages ---

        if (event === 'SIGNED_IN') {
          setSession(currentSession);
          router.push('/');
        }

        if (event === 'SIGNED_OUT') {
          setSession(null);
          router.push('/login');
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Application...</div>;
  }

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};