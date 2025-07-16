// src/app/admin/payments/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define types for our data objects
interface PaymentSummary {
  total_revenue: number;
  total_transactions: number;
  average_transaction_value: number;
}

interface Payment {
  payment_id: string;
  payment_date: string;
  user_email: string;
  amount: number;
  method: string;
  rental_id: string;
}

interface PaymentMethodData {
    method: string;
    count: number;
}

// Define some colors for our pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function PaymentsPage() {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [methodData, setMethodData] = useState<PaymentMethodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all three data points in parallel for efficiency
        const [summaryRes, paymentsRes, methodRes] = await Promise.all([
          supabase.rpc('get_payment_summary'),
          supabase.rpc('get_all_payments'),
          supabase.rpc('get_payment_method_distribution')
        ]);

        if (summaryRes.error) throw summaryRes.error;
        if (paymentsRes.error) throw paymentsRes.error;
        if (methodRes.error) throw methodRes.error;

        setSummary(summaryRes.data[0] || null);
        setPayments(paymentsRes.data || []);
        setMethodData(methodRes.data || []);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        console.error("Error fetching payment data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter payments based on the search term in the user's email
  const filteredPayments = useMemo(() => {
    if (!searchTerm) {
      return payments;
    }
    return payments.filter(payment =>
      payment.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, payments]);

  if (loading) return <div>Loading payment data...</div>;
  if (error) return <div className="text-red-500 p-4 bg-red-50 rounded-md">Error: {error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Payments Overview</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Lifetime Revenue</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">${summary?.total_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{summary?.total_transactions}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Average Transaction Value</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">${summary?.average_transaction_value.toFixed(2)}</p>
        </div>
      </div>

      {/* Payment Method Pie Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Method Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="method"
                    label={({ name, percent }) => `${name} ${(percent || 0) * 100}%`}
                >
                    {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction Log Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search by user email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xs p-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rental ID</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(payment.payment_date).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.user_email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.method}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                    <Link href={`/admin/see-details?rentalId=${payment.rental_id}`}>
                      View Rental
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}