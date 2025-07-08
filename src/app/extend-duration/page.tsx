"use client";

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Define the prices for extending the duration
const EXTENSION_PRICES = {
  one_day: 5.99,
  three_days: 14.99,
  one_week: 29.99,
};

// Define an interface for the rental data we fetch
interface ActiveRental {
  id: string;
  box_id: string; // We need box_id to fetch the box_code
  box_code: string;
  current_end_date: string;
}

// This is the client component that contains all the page logic
function ExtendDurationClientComponent() {
  'use client';

  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get('rentalId');

  const [rental, setRental] = useState<ActiveRental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<string>('');

  const durationOptions = [
    { value: 'one_day', label: 'Add One Day' },
    { value: 'three_days', label: 'Add Three Days' },
    { value: 'one_week', label: 'Add One Week' },
  ];

  // UPDATED: This useEffect now uses two simple queries instead of one complex one.
  useEffect(() => {
    const fetchRentalDetails = async () => {
      if (!rentalId) {
        setError("No rental specified.");
        setLoading(false);
        return;
      }
      try {
        // Step 1: Fetch the rental details first.
        const { data: rentalData, error: rentalError } = await supabase
          .from('rentals')
          .select('id, end_date, status, box_id')
          .eq('id', rentalId)
          .single();

        if (rentalError || !rentalData) throw new Error("Could not find this rental.");
        if (rentalData.status !== 'active') throw new Error("This rental is not active and cannot be extended.");

        // Step 2: If the rental is found, use its box_id to fetch the box details.
        const { data: boxData, error: boxError } = await supabase
            .from('boxes')
            .select('box_code')
            .eq('id', rentalData.box_id)
            .single();
        
        if (boxError || !boxData) throw new Error("Could not find the associated box details for this rental.");

        // Step 3: Combine the data into our state object.
        setRental({
          id: rentalData.id,
          box_id: rentalData.box_id,
          box_code: boxData.box_code,
          current_end_date: new Date(rentalData.end_date).toLocaleString(),
        });

      } catch (err) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRentalDetails();
  }, [rentalId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental || !selectedDuration) return;

    setSubmitting(true);
    setError(null);
    
    const price = EXTENSION_PRICES[selectedDuration as keyof typeof EXTENSION_PRICES];

    try {
      const { error: rpcError } = await supabase.rpc('handle_rental_extension', {
        rental_id_input: rental.id,
        duration_to_add: selectedDuration,
        payment_method_input: 'credit_card', // Or get from a form
        extension_price: price,
      });

      if (rpcError) throw rpcError;

      router.push('/my-orders?extended=true');

    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Rental Details...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Extend Your Rental</h2>
        <p className="text-gray-600 mb-6">
          Your rental for **Box {rental?.box_code}** currently ends on **{rental?.current_end_date}**.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Extension Duration</label>
            <div className="space-y-3 rounded-md bg-gray-50 p-4">
              {durationOptions.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio" id={option.value} name="duration" value={option.value}
                    checked={selectedDuration === option.value}
                    onChange={() => setSelectedDuration(option.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={option.value} className="ml-3 block text-sm font-medium text-gray-700">
                    {option.label} - ${EXTENSION_PRICES[option.value as keyof typeof EXTENSION_PRICES].toFixed(2)}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!selectedDuration || submitting}
            className="w-full flex justify-center py-3 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {submitting ? 'Processing Payment...' : 'Pay and Extend'}
          </button>
        </form>
      </div>
    </div>
  );
}

// This is the main page component that wraps our client logic in Suspense
export default function ExtendDurationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ExtendDurationClientComponent />
        </Suspense>
    );
}