"use client";

// STEP 1: All imports now live at the top of the file.
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Interfaces and constants can remain here.
interface BookingFormData {
  boxId: string;
  boxCode: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  rentDuration: string;
  itemsType: string;
}

const DURATION_PRICES = {
  one_day: 5.99,
  three_days: 14.99,
  one_week: 29.99,
  one_month: 99.99,
};

// STEP 2: The client component contains all the page logic.
// The 'use client' directive MUST be the first line inside this component.
function BookingClientComponent() {
  'use client';

  const router = useRouter();
  const searchParams = useSearchParams();
  const boxId = searchParams.get('boxId');

  // The rest of your original page logic remains here, unchanged.
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [formData, setFormData] = useState<BookingFormData>({
    boxId: '',
    boxCode: '',
    userId: '',
    userFullName: '',
    userEmail: '',
    rentDuration: '',
    itemsType: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationOptions = [
    { value: 'one_day', label: 'One day' },
    { value: 'three_days', label: 'Three days' },
    { value: 'one_week', label: 'One week' },
    { value: 'one_month', label: 'One month' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { throw new Error('You must be logged in to book a box.'); }

        const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();
        const userFullName = profile?.full_name || user.user_metadata?.full_name || '';
        const userEmail = profile?.email || user.email || '';

        if (!boxId) { throw new Error('No box selected.'); }

        const { data: box } = await supabase.from('boxes').select('id, box_code, status').eq('id', boxId).single();
        if (!box) { throw new Error('Box not found.'); }
        if (box.status !== 'available') { throw new Error('Deposit box already rented.'); }

        setFormData({
          boxId: box.id,
          boxCode: box.box_code,
          userId: user.id,
          userFullName,
          userEmail,
          rentDuration: '',
          itemsType: '',
        });
      } catch (err) {
        if (err instanceof Error) { setError(err.message); }
        else { setError('An unexpected error occurred.'); }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [boxId]);

  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration);
    setFormData(prev => ({ ...prev, rentDuration: duration }));
  };

  const handleItemsTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, itemsType: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { throw new Error('You must be logged in to book a box.'); }
      const price = DURATION_PRICES[formData.rentDuration as keyof typeof DURATION_PRICES];
      if (!price) { throw new Error('Invalid duration selected'); }
      const { error: userCheckError } = await supabase.from('users').select('id').eq('id', user.id).single();
      if (userCheckError) {
        const { error: createUserError } = await supabase.from('users').insert({ id: user.id, email: user.email, full_name: user.user_metadata?.full_name || '', created_at: new Date().toISOString() });
        if (createUserError) { throw new Error(`Failed to create user record: ${createUserError.message}`); }
      }
      const { data: rental, error: rentalError } = await supabase.from('rentals').insert({ user_id: user.id, box_id: formData.boxId, status: 'pending', price: price, payment_status: 'pending', pin_code: '', items_type: formData.itemsType, rent_duration: formData.rentDuration, barcode: crypto.randomUUID() }).select().single();
      if (rentalError) { throw new Error(`Failed to create rental: ${rentalError.message}`); }
      const { error: boxError } = await supabase.from('boxes').update({ status: 'pending' }).eq('id', formData.boxId);
      if (boxError) { throw new Error(`Failed to update box status: ${boxError.message}`); }
      router.push(`/payment?rentalId=${rental.id}`);
    } catch (err) {
      if (err instanceof Error) { setError(err.message); }
      else { setError('An unexpected error occurred.'); }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
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

  // Your original JSX remains here
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Deposit Box</h2>
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Box ID</label>
            <p className="mt-1 text-gray-900">{formData.boxId}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Box Code</label>
            <p className="mt-1 text-gray-900">{formData.boxCode}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <p className="mt-1 text-gray-900">{formData.userFullName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-gray-900">{formData.userEmail}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Rent Duration
            </label>
            <div className="space-y-3">
              {durationOptions.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    id={option.value}
                    name="duration"
                    value={option.value}
                    checked={selectedDuration === option.value}
                    onChange={() => handleDurationChange(option.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    required
                  />
                  <label
                    htmlFor={option.value}
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    {option.label} - ${DURATION_PRICES[option.value as keyof typeof DURATION_PRICES].toFixed(2)}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="itemsType" className="block text-sm font-medium text-gray-700">
              What items will you store?
            </label>
            <input
              type="text"
              id="itemsType"
              name="itemsType"
              value={formData.itemsType}
              onChange={handleItemsTypeChange}
              placeholder="e.g., Documents, Jewelry, Electronics"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!selectedDuration || !formData.itemsType || submitting}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${(selectedDuration && formData.itemsType && !submitting)
                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'bg-gray-400 cursor-not-allowed'
              }`}
          >
            {submitting ? 'Processing...' : 'Book Now'}
          </button>
        </form>
      </div>
    </div>
  );
}


// STEP 3: The default export is now the clean wrapper component.
export default function BookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Booking Page...</div>}>
      <BookingClientComponent />
    </Suspense>
  );
}
