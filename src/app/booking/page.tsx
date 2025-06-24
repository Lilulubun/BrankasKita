'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Barcode from 'react-barcode';

interface Box {
  id: string;
  box_code: string;
  status: string;
  items_type?: string;
}

interface BookingFormData {
  boxId: string;
  boxCode: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  rentDuration: string;
  itemsType: string;
}

// Duration pricing configuration
const DURATION_PRICES = {
  one_day: 5.99,
  three_days: 14.99,
  one_week: 29.99,
  one_month: 99.99,
};

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boxId = searchParams.get('boxId');

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
        // Fetch user from Supabase Auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('You must be logged in to book a box.');
          setLoading(false);
          return;
        }

        // Fetch user profile data from the 'profiles' table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        // Get user name and email from profile or auth user
        const userFullName = profile?.full_name || user.user_metadata?.full_name || '';
        const userEmail = profile?.email || user.email || '';

        // Fetch box info
        if (!boxId) {
          setError('No box selected.');
          setLoading(false);
          return;
        }
        const { data: box, error: boxError } = await supabase
          .from('boxes')
          .select('id, box_code, status')
          .eq('id', boxId)
          .single();
        if (boxError || !box) {
          setError('Box not found.');
          setLoading(false);
          return;
        }
        if (box.status !== 'available') {
          setError('Deposit box already rented.');
          setLoading(false);
          return;
        }
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
        console.error('Error fetching data:', err);
        setError('An unexpected error occurred.');
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
      // Fetch user from Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('You must be logged in to book a box.');
        setSubmitting(false);
        return;
      }

      // Calculate price based on duration
      const price = DURATION_PRICES[formData.rentDuration as keyof typeof DURATION_PRICES];
      
      if (!price) {
        throw new Error('Invalid duration selected');
      }

      // First, ensure user exists in the users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (userCheckError) {
        // User doesn't exist in users table, need to create entry
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            created_at: new Date().toISOString()
          });
          
        if (createUserError) {
          throw new Error(`Failed to create user record: ${createUserError.message}`);
        }
      }

      // Insert new record into rentals table
      const { data: rental, error: rentalError } = await supabase
        .from('rentals')
        .insert({
          user_id: user.id,
          box_id: formData.boxId,
          status: 'pending',
          price: price,
          payment_status: 'pending',
          pin_code: '',
          items_type: formData.itemsType,
          rent_duration: formData.rentDuration,
          barcode: crypto.randomUUID()
        })
        .select()
        .single();

      if (rentalError) {
        throw new Error(`Failed to create rental: ${rentalError.message}`);
      }

      // Update box status to 'pending'
      const { error: boxError } = await supabase
        .from('boxes')
        .update({ status: 'pending' })
        .eq('id', formData.boxId);

      if (boxError) {
        throw new Error(`Failed to update box status: ${boxError.message}`);
      }

      // Redirect to payment page with rental ID
      router.push(`/payment?rentalId=${rental.id}`);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to process your booking. Please try again.');
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Deposit Box</h2>
        {/* Pre-filled Information */}
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
        {/* Form Fields */}
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
          
          {/* Items Type Field */}
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