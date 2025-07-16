// src/app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueSummary {
  last_7_days_revenue: number;
  last_30_days_revenue: number;
}
interface BoxSummary {
  total_boxes: number;
  rented_boxes: number;
}
interface WeeklyActivity {
  day: string;
  count: number;
}

export default function AdminDashboardPage() {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [boxes, setBoxes] = useState<BoxSummary | null>(null);
  const [activity, setActivity] = useState<WeeklyActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [revenueRes, boxesRes, activityRes] = await Promise.all([
          supabase.rpc('get_revenue_summary'),
          supabase.rpc('get_box_summary'),
          supabase.rpc('get_weekly_activity')
        ]);

        if (revenueRes.error) throw revenueRes.error;
        if (boxesRes.error) throw boxesRes.error;
        if (activityRes.error) throw activityRes.error;

        setRevenue(revenueRes.data[0]);
        setBoxes(boxesRes.data[0]);
        setActivity(activityRes.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return <div>Loading Dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Revenue (Last 7 Days)</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">${revenue?.last_7_days_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Revenue (Last 30 Days)</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">${revenue?.last_30_days_revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Boxes</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{boxes?.total_boxes}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Rented Boxes</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{boxes?.rented_boxes}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Weekly Activity (New Rentals)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={activity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
