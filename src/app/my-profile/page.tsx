'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setUserId(user.id);

        // Ambil nama dari tabel users
        const { data, error } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (data) setFullName(data.full_name);
        if (error) console.error('Error fetching full_name:', error);
      }
    };

    getUserProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Re-authenticate user (verifikasi password)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data?.user) {
      setError('Invalid password. Please try again.');
      return;
    }

    // Update nama di tabel users
    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name: fullName })
      .eq('id', userId);

    if (updateError) {
      setError('Failed to update profile.');
      return;
    }

    // Update metadata Supabase Auth
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });

    if (metadataError) {
      setError('Failed to update auth profile.');
      return;
    }

    // ✅ Refresh session supaya navbar langsung ambil nama baru
    await supabase.auth.refreshSession();

    setSuccess('Profile updated successfully!');
    setPassword('');

    // Redirect to home after update
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h2 className="text-center text-2xl font-bold mb-4">Edit Profile</h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border-b border-gray-400 focus:outline-none py-2 px-1"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full border-b border-gray-400 py-2 px-1 bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Password (For Confirmation)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-gray-400 focus:outline-none py-2 px-1"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}