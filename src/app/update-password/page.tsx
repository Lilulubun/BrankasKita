'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // This new state controls what the user sees.
  const [status, setStatus] = useState<'verifying' | 'ready' | 'redirecting'>('verifying');

  // This useEffect hook is the key to the fix.
  // It runs once and determines if the user is in the correct password recovery flow.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // This event fires specifically when the user lands on the page from the reset email.
      if (event === 'PASSWORD_RECOVERY') {
        // The user is in the correct flow. We can show them the form.
        setStatus('ready');
      } else if (session) {
        // A user is already logged in, but it's NOT a password recovery.
        // This means they navigated here by mistake. Redirect them.
        setStatus('redirecting');
        router.replace('/');
      } else {
        // No session and no recovery event means the link is invalid or expired.
        setError('Invalid or expired password reset link. Please try again.');
        setStatus('ready'); // Show the error message.
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Your password has been updated successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  // Render different UI based on the current status
  if (status === 'verifying') {
    return (
        <div className="max-w-md mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Verifying Link...</h2>
            <p>Please wait while we verify your password reset request.</p>
        </div>
    );
  }
  
  if (status === 'redirecting') {
    return (
        <div className="max-w-md mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Redirecting...</h2>
            <p>You are already logged in.</p>
        </div>
    );
  }

  // If status is 'ready', show the form (or an error message).
  return (
    <div className="max-w-md mx-auto p-8">
      <h2 className="text-2xl font-bold mb-4">Update Your Password</h2>
      <form onSubmit={handleUpdatePassword}>
        <input
          type="password"
          placeholder="Enter your new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded mb-4"
        />
        <input
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full p-2 border rounded mb-4"
        />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
      {message && <p className="text-green-600 mt-4">{message}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}