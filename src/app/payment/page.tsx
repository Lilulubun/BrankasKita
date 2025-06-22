'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface RentalDetails {
  id: string;
  box_id: string;
  box_code: string;
  price: number;
  rent_duration: string;
  items_type: string;
  user_name: string;
}

// Payment method options configuration
const PAYMENT_METHODS = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'digital_wallet', label: 'Digital Wallet' },
];

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
      setLoading(true);
      setError(null);

      if (!rentalId) {
        setError('No rental ID provided.');
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('You must be logged in to complete the payment.');
          setLoading(false);
          return;
        }

        const { data: rentalData, error: rentalError } = await supabase
          .from('rentals')
          .select('id, box_id, price, rent_duration, items_type, payment_status')
          .eq('id', rentalId)
          .single();

        if (rentalError || !rentalData) {
          throw new Error('Failed to load rental details.');
        }

        if (rentalData.payment_status === 'paid') {
            setError('This rental has already been paid for.');
            setLoading(false);
            return;
        }

        const { data: boxData, error: boxError } = await supabase
          .from('boxes')
          .select('box_code')
          .eq('id', rentalData.box_id)
          .single();

        if (boxError || !boxData) {
          throw new Error('Failed to load box details.');
        }

        setRental({
          id: rentalData.id,
          box_id: rentalData.box_id,
          box_code: boxData.box_code,
          price: rentalData.price,
          rent_duration: rentalData.rent_duration,
          items_type: rentalData.items_type,
          user_name: user.user_metadata?.full_name || user.email || '',
        });
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchRentalDetails();
  }, [rentalId]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental) return;
    
    setError(null);
    setProcessing(true);

    try {
      // Use the robust RPC function for an atomic transaction
      const { error: rpcError } = await supabase.rpc('handle_successful_payment', {
        rental_id_input: rental.id,
        box_id_input: rental.box_id,
        payment_method_input: paymentMethod,
      });

      if (rpcError) {
        throw new Error(`Payment processing failed: ${rpcError.message}`);
      }
      
      router.push(`/set-pin?rentalId=${rental.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading Payment Details...</div>
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

  if (!rental) {
     return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow-md text-gray-800 text-lg">No rental details found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Payment</h2>
        
        {/* Payment Details Section */}
        <div className="mb-6 space-y-4 border-t border-b border-gray-200 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Payer</label>
            <p className="mt-1 text-lg text-gray-900">{rental.user_name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Box Code</label>
            <p className="mt-1 text-lg text-gray-900">{rental.box_code}</p>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700">Items to Store</label>
            <p className="mt-1 text-lg text-gray-900">{rental.items_type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Price</label>
            <p className="mt-1 text-2xl font-semibold text-blue-600">${rental.price.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePayment} className="space-y-6">
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>
          
          <button
            type="submit"
            disabled={processing}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${!processing
                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'bg-gray-400 cursor-not-allowed'
              }`}
          >
            {processing ? 'Processing...' : `Pay $${rental.price.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}