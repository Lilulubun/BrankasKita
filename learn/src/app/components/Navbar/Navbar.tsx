'use client';

// src/app/components/Navbar/Navbar.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './navbar.css';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// Define types for the navigation items
interface NavItem {
  id: string;
  label: string;
}

export default function Navbar(): React.ReactElement {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = document.querySelector('nav')?.offsetHeight || 0;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <Link href="/" className="logo-icon">
          <Image src={'/logo-transparent.svg'} width={128} height={48} alt={'logo'}/>
        </Link>
      </div>

      <div className='right-side-nav'>
        <div className="nav-links">
          <a href="/" className="nav-item active" onClick={(e) => handleNavClick(e, 'hero')}>
            Home
          </a>
          <a href="#booking" className="nav-item" onClick={(e) => handleNavClick(e, 'booking')}>
            Booking
          </a>
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
  );
}