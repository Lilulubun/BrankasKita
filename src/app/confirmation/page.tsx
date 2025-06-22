'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface RentalConfirmation {
  id: string;
  box_code: string;
  pin_code: string;
  start_date: string;
  end_date: string;
  price: number;
  items_type: string;
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const rentalId = searchParams.get('rentalId');
  const router = useRouter();
  
  const [confirmation, setConfirmation] = useState<RentalConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfirmationDetails = async () => {
      if (!rentalId) {
        setError('No rental ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch rental details
        const { data: rentalData, error: rentalError } = await supabase
          .from('rentals')
          .select(`
            id, 
            start_date,
            end_date,
            price,
            pin_code,
            items_type,
            box_id
          `)
          .eq('id', rentalId)
          .single();

        if (rentalError || !rentalData) {
          console.error('Rental fetch error:', rentalError);
          setError('Failed to load rental details');
          setLoading(false);
          return;
        }

        // Fetch box details separately
        const { data: boxData, error: boxError } = await supabase
          .from('boxes')
          .select('box_code')
          .eq('id', rentalData.box_id)
          .single();

        if (boxError || !boxData) {
          console.error('Box fetch error:', boxError);
          setError('Failed to load box details');
          setLoading(false);
          return;
        }

        setConfirmation({
          id: rentalData.id,
          box_code: boxData.box_code,
          pin_code: rentalData.pin_code,
          start_date: formatDate(rentalData.start_date),
          end_date: formatDate(rentalData.end_date),
          price: rentalData.price,
          items_type: rentalData.items_type
        });
      } catch (err) {
        console.error('Error fetching confirmation:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmationDetails();
  }, [rentalId]);

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

  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading confirmation...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow text-red-600 text-lg">{error}</div>
      </div>
    );
  }
  
  if (!confirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow text-red-600 text-lg">Confirmation details not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-green-600">
          <h2 className="text-xl font-bold text-white">Booking Confirmed!</h2>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-center text-gray-700 mb-6">
              Your deposit box has been successfully booked. Please use the PIN code to access your box.
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Box Code</p>
              <p className="text-lg font-bold">{confirmation.box_code}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">PIN Code</p>
              <p className="text-lg font-bold">{confirmation.pin_code}</p>
              <p className="text-xs text-red-500 mt-1">Keep this PIN secure. You'll need it to access your box.</p>
            </div>
            
            <div className="flex space-x-4">
              <div className="bg-gray-50 p-4 rounded-lg flex-1">
                <p className="text-sm text-gray-500 mb-1">Start Date</p>
                <p className="font-medium">{confirmation.start_date}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex-1">
                <p className="text-sm text-gray-500 mb-1">End Date</p>
                <p className="font-medium">{confirmation.end_date}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Items Type</p>
              <p className="font-medium">{confirmation.items_type}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Paid</p>
              <p className="text-lg font-bold text-green-600">${confirmation.price.toFixed(2)}</p>
            </div>
          </div>
          
          <button
            onClick={handleBackToHome}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}