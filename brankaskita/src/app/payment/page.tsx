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
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('You must be logged in to view rental details.');
          setLoading(false);
          return;
        }

        const { data: rentalData, error: rentalError } = await supabase
          .from('rentals')
          .select('id, box_id, price, status, payment_status, items_type')
          .eq('id', rentalId)
          .single();

        if (rentalError || !rentalData) {
          setError('Failed to load rental details');
          setLoading(false);
          return;
        }

        const { data: boxData, error: boxError } = await supabase
          .from('boxes')
          .select('id, box_code, status')
          .eq('id', rentalData.box_id)
          .single();

        if (boxError || !boxData) {
          setError('Failed to load box details');
          setLoading(false);
          return;
        }

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
          user_name: user.user_metadata?.full_name || '',
          user_email: user.email || '',
        });
      } catch {
        setError('Unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRentalDetails();
  }, [rentalId]);

  const calculateDates = (duration: string) => {
    const startDate = new Date();
    const endDate = new Date(startDate);
    switch (duration) {
      case 'one_day': endDate.setDate(startDate.getDate() + 1); break;
      case 'three_days': endDate.setDate(startDate.getDate() + 3); break;
      case 'one_week': endDate.setDate(startDate.getDate() + 7); break;
      case 'one_month': endDate.setMonth(startDate.getMonth() + 1); break;
    }
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental) return;
    setError(null);
    setProcessing(true);

    try {
      const { startDate, endDate } = calculateDates(rental.rent_duration);

      const { error: paymentError } = await supabase.from('payments').insert({
        rental_id: rental.id,
        amount: rental.price,
        payment_date: new Date().toISOString(),
        method: paymentMethod,
        status: 'paid',
      });

      if (paymentError) throw new Error(paymentError.message);

      const { error: rentalUpdateError } = await supabase.from('rentals').update({
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        payment_status: 'paid',
      }).eq('id', rental.id);

      if (rentalUpdateError) throw new Error(rentalUpdateError.message);

      await supabase.from('boxes').update({ status: 'unavailable' }).eq('id', rental.box_id);

      router.push(`/set-pin?rentalId=${rental.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!rental) return <p>No rental found.</p>;

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Pay for Box {rental.box_code}</h2>
      <p>Total: ${rental.price.toFixed(2)}</p>
      <form onSubmit={handlePayment} className="mt-4 space-y-4">
        <div>
          <label htmlFor="method" className="block mb-2">Payment Method</label>
          <select
            id="method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="border p-2 rounded w-full"
          >
            <option value="credit_card">Credit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="digital_wallet">Digital Wallet</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={processing}
          className={`w-full px-4 py-2 rounded text-white ${processing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          {processing ? 'Processing...' : 'Complete Payment'}
        </button>
      </form>
    </div>
  );
}
