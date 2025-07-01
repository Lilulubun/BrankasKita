// src/app/update-password/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordDebugger() {
  const [authEvent, setAuthEvent] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<string | null>(null);

  useEffect(() => {
    // This listener will catch the event that fires when the page loads
    // after clicking the password reset link.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // We will display the event name directly on the screen.
        setAuthEvent(event);
        setSessionData(session ? JSON.stringify(session, null, 2) : 'No Session');
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center text-center bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Auth Event Debugger</h1>
        <p className="text-gray-700 mb-2">
          This page is listening for a Supabase auth event.
        </p>
        <div className="mt-6 p-4 bg-gray-50 rounded border text-left">
          <p className="font-mono text-sm">
            <span className="font-bold">Event Received:</span>
            <span className="ml-2 text-blue-600 font-semibold">
              {authEvent || 'Waiting for event...'}
            </span>
          </p>
          <pre className="mt-4 text-xs bg-gray-200 p-2 rounded overflow-auto">
            <code>
                {sessionData || 'No session data.'}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}