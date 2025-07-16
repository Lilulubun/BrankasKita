"use client";

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// NEW: An interface to hold the data we'll need for the notification email.
interface PinPageData {
  userEmail: string;
  userName: string;
  boxCode: string;
}

// STEP 1: Move all original page logic into a new client component
function SetPinClientComponent() {
    'use client';

    const router = useRouter();
    const searchParams = useSearchParams();
    const rentalId = searchParams.get('rentalId');
  
    const [pin, setPin] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
  
    // NEW: State to store the notification data we fetch.
    const [pageData, setPageData] = useState<PinPageData | null>(null);
  
    // MODIFIED: This useEffect now fetches all necessary data for validation and notification.
    useEffect(() => {
      const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
  
        if (!rentalId) {
          setError('No rental ID found.');
          setLoading(false);
          return;
        }
  
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('You must be logged in to set a PIN.');
          }
  
          const { data: rentalData, error: fetchError } = await supabase
            .from('rentals')
            .select('payment_status, pin_code, box_id') // Added box_id to the query
            .eq('id', rentalId)
            .single();
  
          if (fetchError || !rentalData) {
            throw new Error('Could not verify rental status.');
          }
  
          // Your original validation checks remain the same
          if (rentalData.payment_status !== 'paid') {
            setError('Payment for this rental has not been completed.');
          } else if (rentalData.pin_code) {
            setError('A PIN has already been set for this rental.');
          }
  
          // NEW: Fetch the box code needed for the notification email
          const { data: boxData, error: boxError } = await supabase
            .from('boxes')
            .select('box_code')
            .eq('id', rentalData.box_id)
            .single();
  
          if (boxError || !boxData) {
              throw new Error('Could not load box details.');
          }
          
          // NEW: Store all the fetched data in state so handleSubmit can use it
          setPageData({
              userEmail: user.email!,
              userName: user.user_metadata?.full_name || 'Valued Customer',
              boxCode: boxData.box_code,
          });
  
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      };
  
      fetchInitialData();
    }, [rentalId]);
  
    // MODIFIED: Your handleSubmit function now triggers the notification.
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
  
      if (!/^\d{4}$/.test(pin)) {
        setError('PIN must be exactly 4 digits.');
        return;
      }
      
      // NEW: Guard clause to ensure we have notification data before submitting.
      if (!pageData) {
          setError('Page data is still loading. Please try again in a moment.');
          return;
      }
  
      setSubmitting(true);
  
      try {
        // Step 1: Your original logic to save the PIN.
        const { error: updateError } = await supabase
          .from('rentals')
          .update({ pin_code: pin }) // For production, this PIN should be hashed for security.
          .eq('id', rentalId);
  
        if (updateError) {
          throw new Error('Failed to save PIN. Please try again.');
        }
        
        // --- NEW NOTIFICATION LOGIC ---
        // Step 2: After successfully saving the PIN, trigger the notification.
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              template: 'pin-set-successfully',
              email: pageData.userEmail,
              name: pageData.userName,
              box_code: pageData.boxCode
            }
          });
        } catch (invokeError) {
          // If the email fails, we log it but don't block the user.
          // The most important thing (setting the PIN) was successful.
          console.error("PIN was set, but failed to send confirmation email:", invokeError);
        }
        // --- END OF NEW LOGIC ---
  
        setSuccess(true);
        
        // Step 3: Your original redirect logic.
        setTimeout(() => {
          router.push(`/confirmation?rentalId=${rentalId}`);
        }, 2000);
  
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setSubmitting(false);
      }
    };
  
    // Your original handlePinChange function
    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      if (value.length <= 4) {
        setPin(value);
      }
    };
    
    // Your original JSX for Loading, Error, and Success states
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Verifying Payment Status...</div>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md text-red-600 text-lg">{error}</div>
        </div>
      );
    }
  
    if (success) {
        return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-4">PIN Set Successfully!</h2>
              <p className="text-gray-700">Redirecting to your confirmation page...</p>
          </div>
        </div>
      );
    }
  
    // Your original form JSX
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Your Secure PIN</h2>
              <p className="text-sm text-gray-600 mb-6">This 4-digit PIN will be used to access your deposit box.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 text-center">
                Enter a 4-digit PIN
              </label>
              <input
                type="text"
                id="pin"
                name="pin"
                value={pin}
                onChange={handlePinChange}
                maxLength={4}
                pattern="\d{4}"
                inputMode="numeric"
                placeholder="••••"
                className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-center text-2xl tracking-[1rem] focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={pin.length !== 4 || submitting}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${(pin.length === 4 && !submitting)
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              {submitting ? 'Saving...' : 'Save and Continue'}
            </button>
          </form>
        </div>
      </div>
    );
}

// STEP 2: The default export is now this clean, simple component.
export default function SetPinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading PIN Page...</div>}>
            <SetPinClientComponent />
        </Suspense>
    );
}
