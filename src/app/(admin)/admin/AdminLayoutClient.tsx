// src/app/(admin)/AdminLayoutClient.tsx
'use client';

import { usePathname } from 'next/navigation';
// IMPORTANT: Update the import path to correctly point to your AuthProvider
import { useAuth } from '@/app/(main)/components/AuthProvider/AuthProvider';
import Sidebar from './components/Sidebar/Sidebar';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get both the session AND the loading state from our provider
  const { session, loading: authLoading } = useAuth();
  const pathname = usePathname();

  // THIS IS THE KEY FIX:
  // First, we wait for the AuthProvider to finish its initial check.
  // While it's loading, we show a simple loading message.
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading Admin Panel...</p>
      </div>
    );
  }

  // If loading is finished AND we are on the login page OR there is no session,
  // render the children directly without the sidebar.
  // This correctly handles showing the login page and protecting other pages.
  if (pathname === '/admin/login' || !session) {
    return <>{children}</>;
  }

  // If we get here, it means loading is false and a session exists.
  // We can now safely render the full admin layout with the sidebar.
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}