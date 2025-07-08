"use client";

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Define the shape of the data we will fetch
interface RentalDetails {
  status: string;
  box_code: string;
  pin_code: string;
  start_date: string;
  end_date: string;
  items_type: string;
  total_paid: number;
}

// This is the client component that contains all the page logic
function SeeDetailsClientComponent() {
  'use client';

  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get('rentalId');

  const [details, setDetails] = useState<RentalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to format dates
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // UPDATED: This useEffect now uses three simple queries instead of one complex one.
  useEffect(() => {
    const fetchDetails = async () => {
      if (!rentalId) {
        setError("No rental specified.");
        setLoading(false);
        return;
      }
      try {
        // Step 1: Fetch the main rental details.
        const { data: rentalData, error: rentalError } = await supabase
          .from('rentals')
          .select('status, pin_code, start_date, end_date, items_type, box_id')
          .eq('id', rentalId)
          .single();

        if (rentalError || !rentalData) {
          throw new Error("Could not find details for this rental.");
        }

        // Step 2: Fetch the associated box details.
        const { data: boxData, error: boxError } = await supabase
          .from('boxes')
          .select('box_code')
          .eq('id', rentalData.box_id)
          .single();

        if (boxError || !boxData) {
            throw new Error("Could not find the associated box details.");
        }

        // Step 3: Fetch all associated payments and sum them up.
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('amount')
          .eq('rental_id', rentalId);
        
        if (paymentsError) {
            throw new Error("Could not fetch payment details.");
        }

        const totalPaid = paymentsData.reduce((sum, p) => sum + p.amount, 0);

        // Step 4: Combine all the data into our state object.
        setDetails({
          status: rentalData.status,
          box_code: boxData.box_code,
          pin_code: rentalData.pin_code || 'Not Set',
          start_date: formatDate(rentalData.start_date),
          end_date: formatDate(rentalData.end_date),
          items_type: rentalData.items_type,
          total_paid: totalPaid,
        });

      } catch (err) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [rentalId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Details...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Rental Details</h1>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            details?.status.toLowerCase() === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {details?.status}
          </span>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-500">Box Code</label>
            <p className="text-lg font-semibold text-gray-900">{details?.box_code}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-500">PIN Code</label>
            <p className="text-lg font-semibold text-gray-900 tracking-widest">{details?.pin_code}</p>
          </div>
          <div className="flex space-x-4">
            <div className="bg-gray-50 p-4 rounded-lg flex-1">
              <label className="block text-sm font-medium text-gray-500">Start Date</label>
              <p className="font-medium text-gray-900">{details?.start_date}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex-1">
              <label className="block text-sm font-medium text-gray-500">End Date</label>
              <p className="font-medium text-gray-900">{details?.end_date}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-500">Items Type</label>
            <p className="text-lg font-semibold text-gray-900">{details?.items_type}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-500">Total Paid</label>
            <p className="text-xl font-bold text-blue-600">${details?.total_paid.toFixed(2)}</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/my-orders')}
          className="w-full mt-8 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to My Orders
        </button>
      </div>
    </div>
  );
}

// This is the main page component that wraps our client logic in Suspense
export default function SeeDetailsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SeeDetailsClientComponent />
        </Suspense>
    );
}
