'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface RentalDetails {
  id: string;
  user_id: string;
  box_id: string;
  box_code: string;
  price: number;
  rent_duration: string;
  items_type: string;
  user_name: string;
  user_email: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get('rentalId');

  const [rental, setRental] = useState<RentalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');

  useEffect(() => {
    const fetchRentalDetails = async () => {
      if (!rentalId) {
        setError('No rental ID provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch user from Supabase Auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('You must be logged in to view rental details.');
          setLoading(false);
          return;
        }

        // Ensure user exists in the users table
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('id', user.id)
          .single();
          
        let userName = user.user_metadata?.full_name || '';
        let userEmail = user.email || '';
        
        if (userCheckError) {
          // User doesn't exist in users table, need to create entry
          const { error: createUserError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: userEmail,
              full_name: userName,
              created_at: new Date().toISOString()
            });
            
          if (createUserError) {
            console.error('Failed to create user record:', createUserError);
          }
        } else if (existingUser) {
          // Use data from users table if available
          userName = existingUser.full_name || userName;
          userEmail = existingUser.email || userEmail;
        }

        // First, get the rental information
        const { data: rentalData, error: rentalError } = await supabase
          .from('rentals')
          .select('id, box_id, price, status, payment_status, items_type')
          .eq('id', rentalId)
          .single();

        if (rentalError || !rentalData) {
          console.error('Rental fetch error:', rentalError);
          setError('Failed to load rental details');
          setLoading(false);
          return;
        }

        // Then, get the box information separately
        const { data: boxData, error: boxError } = await supabase
          .from('boxes')
          .select('id, box_code, status')
          .eq('id', rentalData.box_id)
          .single();

        if (boxError || !boxData) {
          console.error('Box fetch error:', boxError);
          setError('Failed to load box details');
          setLoading(false);
          return;
        }

        // Determine rent duration based on price
        let rentDuration = 'one_day';
        if (rentalData.price >= 99) rentDuration = 'one_month';
        else if (rentalData.price >= 29) rentDuration = 'one_week';
        else if (rentalData.price >= 14) rentDuration = 'three_days';

        setRental({
          id: rentalData.id,
          user_id: user.id,
          box_id: rentalData.box_id,
          box_code: boxData.box_code,
          price: rentalData.price,
          rent_duration: rentDuration,
          items_type: rentalData.items_type,
          user_name: userName,
          user_email: userEmail
        });
      } catch (err) {
        console.error('Error fetching rental:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRentalDetails();
  }, [rentalId]);

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentMethod(e.target.value);
  };

  const generatePinCode = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const calculateDates = (duration: string) => {
    const startDate = new Date();
    const endDate = new Date(startDate);

    switch (duration) {
      case 'one_day':
        endDate.setDate(startDate.getDate() + 1);
        break;
      case 'three_days':
        endDate.setDate(startDate.getDate() + 3);
        break;
      case 'one_week':
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'one_month':
        endDate.setMonth(startDate.getMonth() + 1);
        break;
      default:
        endDate.setDate(startDate.getDate() + 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rental) return;

    setProcessing(true);
    setError(null);

    try {
      const pinCode = generatePinCode();
      const { startDate, endDate } = calculateDates(rental.rent_duration);

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          rental_id: rental.id,
          amount: rental.price,
          payment_date: new Date().toISOString(),
          method: paymentMethod,
          status: 'paid',
        });

      if (paymentError) throw new Error(`Payment record creation failed: ${paymentError.message}`);

      const { error: rentalUpdateError } = await supabase
        .from('rentals')
        .update({
          start_date: startDate,
          end_date: endDate,
          pin_code: pinCode,
          status: 'active',
          payment_status: 'paid',
        })
        .eq('id', rental.id);

      if (rentalUpdateError) throw new Error(`Rental update failed: ${rentalUpdateError.message}`);

      const { error: boxUpdateError } = await supabase
        .from('boxes')
        .update({
          status: 'unavailable',
        })
        .eq('id', rental.box_id);

      if (boxUpdateError) throw new Error(`Box update failed: ${boxUpdateError.message}`);

      router.push(`/confirmation?rentalId=${rental.id}`);
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err instanceof Error ? err.message : 'Payment processing failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading payment details...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  if (!rental) {
    return <div className="min-h-screen flex items-center justify-center">Rental information not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-blue-600">
          <h2 className="text-xl font-bold text-white">Complete Your Payment</h2>
        </div>

        <div className="p-6">
          <div className="mb-6 space-y-3">
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Box Code:</span>
              <span className="font-medium">{rental.box_code}</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Items Type:</span>
              <span className="font-medium">{rental.items_type}</span>
            </div>
            <div className="flex justify-between border-b pb-3">
              <span className="text-gray-600">Renter:</span>
              <span className="font-medium">{rental.user_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-xl font-bold text-blue-600">${rental.price.toFixed(2)}</span>
            </div>
          </div>

          <form onSubmit={handlePayment} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method
              </label>
              <div className="space-y-3">
                {['credit_card', 'bank_transfer', 'digital_wallet'].map((method) => (
                  <div className="flex items-center" key={method}>
                    <input
                      type="radio"
                      id={method}
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={handlePaymentMethodChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor={method} className="ml-3 block text-sm font-medium text-gray-700 capitalize">
                      {method.replace('_', ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600">
              <p>
                This is a demo environment. By clicking "Complete Payment", the transaction will be simulated as successful.
              </p>
            </div>

            <button
              type="submit"
              disabled={processing}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {processing ? 'Processing...' : 'Complete Payment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}