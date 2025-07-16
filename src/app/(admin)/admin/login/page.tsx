// src/app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Authentication failed.");

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single();

      if (userError) throw new Error("Could not verify user role.");

      if (userData?.is_admin) {
        router.push('/admin/dashboard');
      } else {
        await supabase.auth.signOut();
        throw new Error("You do not have permission to access the admin panel.");
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use the same light gray background as your main app
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
            <Link href="/" className="inline-block mb-6">
                {/* You can use your logo component or an Image tag here */}
                <span className="text-2xl font-bold">Brankas Kita</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel Login</h1>
        </div>
        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 mt-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && <p className="text-red-500 text-center pt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
