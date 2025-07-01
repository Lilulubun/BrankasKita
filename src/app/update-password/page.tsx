// src/app/update-password/page.tsx
'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// This is the component that contains all the logic.
// It will only be rendered in the browser, which is what we need.
function UpdatePasswordClientComponent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'verifying' | 'ready' | 'submitting' | 'success'>('verifying');

  // This useEffect is the key. It listens for the special 'PASSWORD_RECOVERY'
  // event that Supabase fires when the user lands on this page from the email link.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          // This event confirms the user is in the correct, secure state.
          // We can now show them the form.
          setStatus('ready');
        }
      }
    );

    // This timer handles the case where the link is invalid from the start.
    const timer = setTimeout(() => {
        if (status === 'verifying') {
            setError("Invalid or expired password reset link. Please request a new one.");
            setStatus('ready'); // Move to 'ready' to show the error message.
        }
    }, 3000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [status]); // The dependency array ensures this runs correctly.

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    setStatus('submitting');
    setMessage('');
    setError('');

    // This function will now work because the Supabase client has correctly
    // maintained the temporary session from the PASSWORD_RECOVERY event.
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setStatus('ready');
    } else {
      setMessage('Your password has been updated successfully! Redirecting to login...');
      setStatus('success');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  if (status === 'verifying') {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Verifying your link...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">Update Your Password</h2>
          {status !== 'success' && (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                    type="password" id="password" placeholder="Enter your new password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm"
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                    type="password" id="confirmPassword" placeholder="Confirm your new password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    required className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm"
                    />
                </div>
                <button type="submit" disabled={status === 'submitting'} className="w-full flex justify-center py-3 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                    {status === 'submitting' ? 'Updating...' : 'Update Password'}
                </button>
            </form>
          )}
          {message && <p className="text-green-600 mt-4 text-center">{message}</p>}
          {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        </div>
    </div>
  );
}

// The main page component is now a simple wrapper that uses <Suspense>.
export default function UpdatePasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <UpdatePasswordClientComponent />
        </Suspense>
    );
}