// src/app/admin/customers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Define types for our data objects
interface Customer {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface SignupActivity {
  day: string;
  count: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [signupActivity, setSignupActivity] = useState<SignupActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // NEW: State to manage the selected date range for the chart
  const [chartRange, setChartRange] = useState<7 | 30>(7);

  // This function now fetches data for the selected range
  const fetchData = async (range: 7 | 30) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both customer list and activity data in parallel
      const [customersRes, activityRes] = await Promise.all([
        supabase.rpc('get_all_customers'),
        // NEW: Call the function with the selected range
        supabase.rpc('get_daily_signups', { days_range: range })
      ]);

      if (customersRes.error) throw customersRes.error;
      if (activityRes.error) throw activityRes.error;

      setCustomers(customersRes.data || []);
      setSignupActivity(activityRes.data || []);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      console.error("Error fetching customer data:", err);
    } finally {
      setLoading(false);
    }
  };

  // This useEffect now re-fetches data whenever the chartRange changes
  useEffect(() => {
    fetchData(chartRange);
  }, [chartRange]);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (window.confirm(`Are you sure you want to delete the user ${userEmail}? This will also delete all of their rentals and payments.`)) {
      try {
        const { error: rpcError } = await supabase.rpc('delete_user_and_data', {
          user_id_to_delete: userId
        });
        if (rpcError) throw rpcError;
        alert('User deleted successfully.');
        // Refresh all data on the page
        await fetchData(chartRange);
      } catch (err) {
        if (err instanceof Error) alert(`Error: ${err.message}`);
      }
    }
  };

  if (loading) return <div>Loading customer data...</div>;
  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-md">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Customer Management</h1>

      {/* Customer Growth Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">New Customer Signups</h3>
          {/* NEW: Date range selector buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setChartRange(7)}
              className={`px-3 py-1 text-sm rounded-md ${chartRange === 7 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setChartRange(30)}
              className={`px-3 py-1 text-sm rounded-md ${chartRange === 30 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Last 30 Days
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={signupActivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" name="New Signups" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Customer List Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined On</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(customer.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDeleteUser(customer.id, customer.email)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}