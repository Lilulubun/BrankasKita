// src/app/components/AuthProvider/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const AuthContext = createContext<{ session: Session | null }>({ session: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // THIS IS THE FIX: A flag to track if we are in the middle of a password recovery.
  // We use a `useRef` here because its value persists across re-renders without causing them.
  const isRecoveringPassword = useRef(false);

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        
        // When the user lands from the email link, this event fires first.
        if (event === 'PASSWORD_RECOVERY') {
          // We set our flag to true.
          isRecoveringPassword.current = true;
          setSession(currentSession);
          return;
        }

        // When the user signs in...
        if (event === 'SIGNED_IN') {
          // ...we check our flag. If a password recovery just happened,
          // we DO NOT redirect. We reset the flag and let the user
          // stay on the /update-password page.
          if (isRecoveringPassword.current) {
            isRecoveringPassword.current = false;
            setSession(currentSession);
            return;
          }
          
          // If it's a normal sign-in, we redirect to the homepage.
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
  }, [router]);

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
