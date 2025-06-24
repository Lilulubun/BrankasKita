// src/app/my-orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Barcode from 'react-barcode';
import BoxIcon from '@/app/components/BoxIcons/BoxIcon'; 
import { useRouter } from 'next/navigation';

// --- Helper functions ---
const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const calculateTimeLeft = (endDate: string): string => {
    if (!endDate) return 'N/A';
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
        return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let timeLeftString = '';
    if (days > 0) timeLeftString += `${days}d `;
    if (hours > 0) timeLeftString += `${hours}h `;
    if (days === 0) timeLeftString += `${minutes}m`;
    
    return timeLeftString.trim() + ' left';
};

// --- Type Definition ---
type Order = {
  id: string;
  start_date: string;
  end_date: string;
  status: string; // Changed to string to accept 'active', 'completed', etc.
  created_at: string;
  rent_duration: string;
  items_type: string;
  barcode: string;
  box_id: string;
  box_code: string;
  box_status: string;
  total_amount: number;
};

// --- Barcode Modal Component ---
const BarcodeModal = ({ isOpen, onClose, barcodeValue }: { isOpen: boolean, onClose: () => void, barcodeValue: string }) => {
  if (!isOpen) return null;
  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-xl p-8 transform transition-all">
        <h3 className="text-xl font-bold text-center mb-4">Your Rental Barcode</h3>
        <div className="flex justify-center">
          <Barcode value={barcodeValue} />
        </div>
        <p className="text-sm text-gray-600 text-center mt-4">Scan this at the station to access your deposit box.</p>
        <button onClick={onClose} className="w-full mt-6 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700">
          Close
        </button>
      </div>
    </div>
  );
};


// --- The Order Card Component (FINAL LOGIC) ---
const OrderCard = ({ order, onShowBarcode }: { order: Order, onShowBarcode: (barcode: string) => void }) => {
    const router = useRouter();
    
    // Create a unified status display to prevent contradictions
    const timeLeft = calculateTimeLeft(order.end_date);
    const isExpired = timeLeft === 'Expired';
    const displayStatus = isExpired ? 'Expired' : order.status;
    
    // A rental is only truly "active" if its status from the DB is 'active' AND it's not expired.
    const isCurrentlyActive = displayStatus.toLowerCase() === 'active';

    const getStatusBadge = () => {
        const statusText = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);
        switch (displayStatus.toLowerCase()) {
            case 'active':
                return <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">{statusText}</span>;
            case 'completed':
                return <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-200 text-gray-700">{statusText}</span>;
            case 'expired':
                 return <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700">{statusText}</span>;
            default:
                 return <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">{statusText}</span>;
        }
    };

    return (
        <div className="bg-white shadow-md rounded-xl p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0">
               <BoxIcon
                 id={order.box_id}
                 status={order.box_status}
                 boxCode={order.box_code}
                 onAvailable={(id) => console.log(`Box available event for ID: ${id}`)}
                 onUnavailable={() => console.log('Box unavailable event')}
               />
            </div>

            <div className="flex-grow w-full">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">
                        Periode: {formatDate(order.start_date)} - {formatDate(order.end_date)}
                    </p>
                    {getStatusBadge()}
                </div>
                
                <h3 className="text-lg font-bold text-gray-800">Deposit Box {order.box_code}</h3>
                <p className="text-sm text-gray-600">Duration: {order.rent_duration}</p>
                <p className="text-sm text-gray-600">Items: {order.items_type}</p>
                
                {isCurrentlyActive && (
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                        Time Left: {timeLeft}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700">
                    See Details
                </button>
                <button 
                  onClick={() => onShowBarcode(order.barcode)}
                  disabled={!isCurrentlyActive}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    Show Barcode
                </button>
                <button 
                  onClick={() => router.push('/extend-duration?rentalId=' + order.id)}
                  disabled={!isCurrentlyActive}
                  className="w-full bg-transparent text-blue-600 px-4 py-2 rounded-lg text-sm border border-blue-600 hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                >
                    Extend Duration
                </button>
            </div>
        </div>
    );
};

// --- The Main Page Component ---
export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState('');

  const handleShowBarcode = (barcode: string) => {
    setSelectedBarcode(barcode);
    setIsModalOpen(true);
  };

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to view your orders.');

      const { data: rentalsData, error: rentalsError } = await supabase
        .from('rentals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (rentalsError) throw rentalsError;

      const detailedOrders: Order[] = await Promise.all(
        rentalsData.map(async (rental) => {
          let boxDetails = { box_code: 'N/A', status: 'Unavailable' };
          const { data: boxData, error: boxError } = await supabase
            .from('boxes').select('box_code, status').eq('id', rental.box_id).single();
          if (boxError) console.error(`Could not fetch box for rental ${rental.id}:`, boxError.message);
          else boxDetails = boxData;

          let paymentAmount = 0;
          const { data: paymentData, error: paymentError } = await supabase
            .from('payments').select('amount').eq('rental_id', rental.id).maybeSingle(); 
          if (paymentError) console.error(`Could not fetch payment for rental ${rental.id}:`, paymentError.message);
          else paymentAmount = paymentData?.amount || 0;

          return { ...rental, box_id: rental.box_id, box_code: boxDetails.box_code, box_status: boxDetails.status, total_amount: paymentAmount };
        })
      );
      setOrders(detailedOrders);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
        fetchOrders();
    }, 60000); // Refresh data every 60 seconds
    fetchOrders(); // Initial fetch
    return () => clearInterval(interval); // Cleanup
  }, []);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading your orders...</div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><div className="bg-white p-6 rounded shadow text-red-600 text-lg">{error}</div></div>;
    
  return (
    <>
      <BarcodeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} barcodeValue={selectedBarcode} />
      <div className="bg-gray-50 min-h-screen p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
              {orders.length > 0 ? (
                  <div>
                      {orders.map((order) => (<OrderCard key={order.id} order={order} onShowBarcode={handleShowBarcode} />))}
                  </div>
              ) : (
                  <p>You have no past or current orders.</p>
              )}
          </div>
      </div>
    </>
  );
}