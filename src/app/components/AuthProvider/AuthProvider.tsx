// src/app/components/AuthProvider/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

// Create a context to hold the session information.
// We are not exporting this as the useAuth hook is the preferred way to access it.
const AuthContext = createContext<{ session: Session | null }>({ session: null });

// This is the provider component that will wrap your entire application.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This function runs once on initial load to get the current session.
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);
    };

    getInitialSession();

    // This listener reacts to all authentication events (sign in, sign out, etc.).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        
        // THIS IS THE CRITICAL FIX:
        // If the user is on the /update-password page, we do NOTHING.
        // We let that page handle its own logic. We only set the session
        // so the page knows the user is in a recovery state.
        if (pathname === '/update-password') {
          setSession(currentSession);
          return;
        }

        // --- The rest of the logic runs for all other pages ---

        // When a user signs in (and it's not a password recovery)...
        if (event === 'SIGNED_IN') {
          setSession(currentSession);
          // ...redirect them to the homepage.
          router.push('/');
        }

        // When a user signs out...
        if (event === 'SIGNED_OUT') {
          setSession(null);
          // ...redirect them to the login page.
          router.push('/login');
        }
      }
    );

    // Cleanup the listener when the component is no longer on screen.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, pathname]); // This effect re-runs if the user navigates to a new page.

  // While checking for the session, show a global loading screen.
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Application...</div>;
  }

  // Once loaded, render the rest of the application.
  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
}

// This is a custom hook that makes it easy to access the session from any client component.
export const useAuth = () => {
  return useContext(AuthContext);
};
