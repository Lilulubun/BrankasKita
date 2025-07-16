// src/app/admin/rentals/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Define the types for our data objects
interface Box {
  id: string;
  box_code: string;
  status: string;
}

interface Rental {
  rental_id: string;
  user_email: string;
  box_code: string;
  status: string;
  start_date: string;
  end_date: string;
  rent_duration: string;
}

// A simple component to render the status with a colored badge
const StatusBadge = ({ status }: { status: string }) => {
  const lowerStatus = status.toLowerCase();
  let colorClasses = 'bg-gray-200 text-gray-800'; // Default for completed/cancelled
  if (lowerStatus === 'active') {
    colorClasses = 'bg-green-100 text-green-800';
  } else if (lowerStatus === 'pending') {
    colorClasses = 'bg-yellow-100 text-yellow-800';
  }

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
      {status}
    </span>
  );
};


export default function BoxAndRentalsPage() {
  const [activeTab, setActiveTab] = useState('boxes');
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRentals = async () => {
    const { data, error } = await supabase.rpc('get_all_rentals');
    if (error) throw error;
    setRentals(data || []);
  };

  const fetchBoxes = async () => {
    const { data, error } = await supabase.rpc('get_all_boxes');
    if (error) throw error;
    setBoxes(data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'boxes') {
          await fetchBoxes();
        } else if (activeTab === 'rentals') {
          await fetchRentals();
        }
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        console.error(`Error fetching ${activeTab}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // NEW: Function to handle the "End Rental" button click
  const handleEndRental = async (rentalId: string) => {
    // Show a confirmation dialog to prevent accidental clicks
    if (window.confirm('Are you sure you want to end this rental? This action cannot be undone.')) {
      try {
        const { error: rpcError } = await supabase.rpc('admin_end_rental', {
          rental_id_input: rentalId,
        });

        if (rpcError) throw rpcError;

        // Refresh the list of rentals to show the updated status
        alert('Rental has been successfully ended.');
        await fetchRentals();

      } catch (err) {
        if (err instanceof Error) alert(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Box & Rental Management</h1>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('boxes')} className={`${activeTab === 'boxes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Boxes
          </button>
          <button onClick={() => setActiveTab('rentals')} className={`${activeTab === 'rentals' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
            Rentals
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500 p-4 bg-red-50 rounded-md">{error}</p>}

        {!loading && activeTab === 'boxes' && (
          /* ... Boxes tab content remains the same ... */
          <div>
            <div className="flex justify-end mb-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                + Create New Box
              </button>
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Box Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boxes.map((box) => (
                    <tr key={box.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{box.box_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <StatusBadge status={box.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href="#" className="text-blue-600 hover:text-blue-900">Edit</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'rentals' && (
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Box</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  {/* NEW: Actions column */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rentals.map((rental) => (
                  <tr key={rental.rental_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rental.user_email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rental.box_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><StatusBadge status={rental.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(rental.start_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(rental.end_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* NEW: The button only appears for 'active' rentals */}
                      {rental.status.toLowerCase() === 'active' && (
                        <button
                          onClick={() => handleEndRental(rental.rental_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          End Rental
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
