// src/app/components/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

// Define the shape of our context
type AuthContextType = {
  session: Session | null;
  loading: boolean;
};

// Create the context
const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
});

// This provider's ONLY job is to listen for auth changes and provide the session.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the initial session when the app loads
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getInitialSession();

    // Set up the single, central listener for any auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        // When the auth state changes, we simply update our session state.
        // NO redirects happen here.
        setSession(currentSession);
      }
    );

    // Cleanup the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {/* We no longer show a loading screen here, to prevent layout shifts */}
      {children}
    </AuthContext.Provider>
  );
}

// A custom hook to easily use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};