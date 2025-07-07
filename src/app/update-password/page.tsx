// src/app/update-password/page.tsx
'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider/AuthProvider'; // Import the hook

function UpdatePasswordClientComponent() {
  const router = useRouter();
  // Get both the session AND the loading state from our provider
  const { session, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Your password has been updated successfully! Redirecting...");
      // Sign out the user after a successful password change for security
      await supabase.auth.signOut();
      setTimeout(() => router.push('/login'), 2000);
    }
    setSubmitting(false);
  };

  // THIS IS THE KEY FIX:
  // First, we wait for the AuthProvider to finish its initial loading.
  if (authLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Verifying link...</p>
        </div>
    );
  }

  // If loading is finished AND there is still no session, the link is invalid.
  if (!authLoading && !session) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Invalid or expired password reset link. Please request a new one.</p>
        </div>
    );
  }

  // If we get here, it means loading is false and a session exists. Show the form.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Set Your New Password</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password" id="password" placeholder="Enter your new password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required className="mt-1 block w-full p-3 border rounded-md shadow-sm"
                  />
              </div>
              <button type="submit" disabled={submitting} className="w-full flex justify-center py-3 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                  {submitting ? 'Updating...' : 'Update Password'}
              </button>
          </form>
          {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <UpdatePasswordClientComponent />
        </Suspense>
    );
}