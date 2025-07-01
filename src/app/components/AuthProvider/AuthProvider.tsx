// src/app/components/AuthProvider/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Create a context to hold the session information
const AuthContext = createContext<{ session: Session | null }>({ session: null });

// This is the provider component that will wrap your app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  

  useEffect(() => {
    // This function runs once to get the initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    // This is the key part: it listens for ALL auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth event:', event); // For debugging

        // THIS IS THE FIX:
        // If the event is PASSWORD_RECOVERY, it means the user just clicked
        // the reset link. We set the session so they are "logged in" temporarily,
        // but we DO NOT redirect them. We let them stay on the /update-password page.
        if (event === 'PASSWORD_RECOVERY') {
          setSession(currentSession);
          return; 
        }

        // If the user signs out, redirect them to the login page
        if (event === 'SIGNED_OUT') {
          setSession(null);
          router.push('/login');
          return;
        }

        // If the user signs in (and it's not a password recovery)...
        if (event === 'SIGNED_IN') {
          setSession(currentSession);
          // ...redirect them to the homepage.
          router.push('/');
          return;
        }
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // While we're checking for the initial session, you can show a loader
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Application...</div>;
  }

  // Once loaded, render the rest of the application
  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
}

// A custom hook to easily access the session from any client component
export const useAuth = () => {
  return useContext(AuthContext);
};
