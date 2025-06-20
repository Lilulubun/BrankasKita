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

  useEffect(() => {
    const checkPayment = async () => {
      if (!rentalId) return;
      const { data, error } = await supabase
        .from('rentals')
        .select('payment_status')
        .eq('id', rentalId)
        .single();

      if (error || !data || data.payment_status !== 'paid') {
        setError('Payment not completed. Cannot set PIN.');
      }
      setLoading(false);
    };

    checkPayment();
  }, [rentalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{4}$/.test(pin)) {
      setError('PIN must be 4 digits');
      return;
    }

    const { error } = await supabase
      .from('rentals')
      .update({ pin_code: pin })
      .eq('id', rentalId);

    if (error) {
      setError('Failed to save PIN');
    } else {
      setSuccess(true);
      router.push(`/confirmation?rentalId=${rentalId}`);
    }
  };

  if (loading) return <p>Checking payment...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Set Your 4-digit PIN</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          pattern="[0-9]{4}"
          className="border rounded p-2 w-full"
          placeholder="Enter PIN"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Save PIN
        </button>
      </form>
    </div>
  );
}