// src/app/components/Navbar/Navbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './navbar.css';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import ChatbotModal from '../ChatbotModal';

export default function Navbar(): React.ReactElement {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Redirect to homepage after logout
    router.refresh(); // Refresh to update server components
  };

  // The handleNavClick function is no longer needed and has been removed.

  return (
    <>  
    <nav className="navbar">
      <div className="logo-container">
        <Link href="/" className="logo-icon">
          <Image src={'/logo-transparent.svg'} width={128} height={48} alt={'logo'}/>
        </Link>
      </div>

      <div className='right-side-nav'>
        <div className="nav-links">
          <button onClick={() => setIsChatbotModalOpen(true)} className="nav-item">
            <Image src={'/bot.svg'} width={24} height={24} alt={'chatbot'}/>
          </button>
          {/* FIX: The href is now just "/" */}
          <Link href="/" className="nav-item active">
            Home
          </Link>
          {/* FIX: The href now correctly points to the booking section on the homepage */}
          {/* The onClick handler has been removed to allow the link to work from any page */}
          <Link href="/#booking" className="nav-item">
            Booking
          </Link>
        </div>
        <div 
          className="userIconContainer"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <div className="user-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="5" />
              <path d="M20 21a8 8 0 10-16 0" />
            </svg>
          </div>
          {user && (
            <span className="greeting">
              Hi! {user.user_metadata?.full_name || user.email?.split('@')[0]}
            </span>
          )}
          {dropdownOpen && (
            <div className="dropdown">
              {user ? (
                <>
                  <Link href="/my-orders" className="dropdownItem">My Orders</Link>
                  <Link href="/notifications" className="dropdownItem">Notifications</Link>
                  <Link href="/my-profile" className="dropdownItem">My Profile</Link>
                  <button onClick={handleLogout} className="dropdownItem w-full text-left">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="dropdownItem">Login</Link>
                  <Link href="/register" className="dropdownItem">Register</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
    <ChatbotModal open={isChatbotModalOpen} onClose={() => setIsChatbotModalOpen(false)} />
    </>
  );
}