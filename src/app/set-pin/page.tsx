'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SetPinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get('rentalId');

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      setLoading(true);
      setError(null);

      if (!rentalId) {
        setError('No rental ID found.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('rentals')
          .select('payment_status, pin_code')
          .eq('id', rentalId)
          .single();

        if (fetchError || !data) {
          throw new Error('Could not verify rental status.');
        }

        if (data.payment_status !== 'paid') {
          setError('Payment for this rental has not been completed.');
        } else if (data.pin_code) {
          setError('A PIN has already been set for this rental.');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [rentalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits.');
      return;
    }

    setSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from('rentals')
        .update({ pin_code: pin })
        .eq('id', rentalId);

      if (updateError) {
        throw new Error('Failed to save PIN. Please try again.');
      }

      setSuccess(true);
      // Redirect after a short delay to allow the user to see the success message
      setTimeout(() => {
        router.push(`/confirmation?rentalId=${rentalId}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setPin(value);
    }
  };
  
  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Verifying Payment Status...</div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow-md text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  // Success State
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