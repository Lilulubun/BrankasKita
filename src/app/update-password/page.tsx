'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/components/AuthProvider/AuthProvider'; // <-- Import the new hook

function UpdatePasswordClientComponent() {
  const router = useRouter();
  const { session } = useAuth(); // <-- Use the hook to get the session
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    // The updateUser function will now work because the session
    // is reliably provided by the AuthProvider.
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Your password has been updated successfully! Redirecting...");
      setTimeout(() => router.push('/login'), 2000);
    }
    setLoading(false);
  };

  // The form is only shown if there is a valid session
  if (!session) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p>Invalid or expired password reset link. Please try again.</p>
        </div>
    );
  }

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
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                  {loading ? 'Updating...' : 'Update Password'}
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
