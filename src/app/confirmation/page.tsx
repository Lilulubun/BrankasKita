// app/confirmation/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Barcode from 'react-barcode';

interface RentalConfirmation {
  id: string;
  box_code: string;
  pin_code: string;
  start_date: string;
  end_date: string;
  price: number;
  items_type: string;
  user_name: string;
  barcode: string; // The unique ID fetched from the database
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const rentalId = searchParams.get('rentalId');
  const router = useRouter();
  
  const [confirmation, setConfirmation] = useState<RentalConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPinVisible, setIsPinVisible] = useState(false); // <-- State for PIN visibility

  useEffect(() => {
    const fetchConfirmationDetails = async () => {
      if (!rentalId) {
        setError('No rental ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { throw new Error('User not authenticated.'); }
        
        const { data: rentalData, error: rentalError } = await supabase
          .from('rentals')
          .select(`id, start_date, end_date, price, pin_code, items_type, box_id, barcode`)
          .eq('id', rentalId)
          .single();

        if (rentalError || !rentalData) { throw new Error('Failed to load rental details.'); }
        if (!rentalData.barcode) { throw new Error('Barcode data for this rental is missing.'); }

        const { data: boxData, error: boxError } = await supabase
          .from('boxes')
          .select('box_code')
          .eq('id', rentalData.box_id)
          .single();

        if (boxError || !boxData) { throw new Error('Failed to load box details.'); }

        setConfirmation({
          id: rentalData.id,
          box_code: boxData.box_code,
          pin_code: rentalData.pin_code,
          start_date: formatDate(rentalData.start_date),
          end_date: formatDate(rentalData.end_date),
          price: rentalData.price,
          items_type: rentalData.items_type,
          user_name: user.user_metadata?.full_name || 'Valued Customer',
          barcode: rentalData.barcode
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchConfirmationDetails();
  }, [rentalId]);

  // Function to toggle the state
  const togglePinVisibility = () => {
    setIsPinVisible(!isPinVisible);
  };

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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading confirmation...</div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="bg-white p-6 rounded shadow text-red-600 text-lg">{error}</div></div>;
  if (!confirmation) return <div className="min-h-screen flex items-center justify-center"><div className="bg-white p-6 rounded shadow text-red-600 text-lg">Confirmation details not found</div></div>;

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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
            </div>
            <p className="text-center text-gray-700 mb-6">
              Hi {confirmation.user_name}, your deposit box is ready. Use your PIN and scan the barcode below to access it.
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Box Code</p>
              <p className="text-lg font-bold">{confirmation.box_code}</p>
            </div>
            
            {/* --- THIS IS THE UPDATED PIN CODE SECTION --- */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 mb-1">PIN Code</p>
                  <p className={`text-lg font-bold ${isPinVisible ? 'tracking-widest' : ''}`}>
                    {isPinVisible ? confirmation.pin_code : '••••'}
                  </p>
                </div>
                <button onClick={togglePinVisibility} className="text-gray-500 hover:text-gray-800 focus:outline-none">
                  {isPinVisible ? (
                    // Eye Slash Icon (PIN is visible)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.14 2.14" /></svg>
                  ) : (
                    // Eye Icon (PIN is hidden)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-red-500 mt-1">Keep this PIN secure.</p>
            </div>
            
            <div className="flex space-x-4">
              <div className="bg-gray-50 p-4 rounded-lg flex-1"><p className="text-sm text-gray-500 mb-1">Start Date</p><p className="font-medium">{confirmation.start_date}</p></div>
              <div className="bg-gray-50 p-4 rounded-lg flex-1"><p className="text-sm text-gray-500 mb-1">End Date</p><p className="font-medium">{confirmation.end_date}</p></div>
            </div>
          </div>

          <div className="text-center border-t pt-6">
            <p className="text-sm text-gray-600 mb-4">
              Scan this barcode at the station for first authorization.
            </p>
            <div className="flex justify-center">
                <Barcode value={confirmation.barcode} />
            </div>
          </div>
          
          <button
            onClick={handleBackToHome}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 mt-8"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}