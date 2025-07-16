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
  let colorClasses = 'bg-gray-200 text-gray-800';
  if (lowerStatus === 'available') colorClasses = 'bg-green-100 text-green-800';
  else if (lowerStatus === 'unavailable' || lowerStatus === 'rented') colorClasses = 'bg-red-100 text-red-800';
  else if (lowerStatus === 'pending') colorClasses = 'bg-yellow-100 text-yellow-800';
  return <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{status}</span>;
};

// Modal Component for creating a new box
const CreateBoxModal = ({ isOpen, onClose, onBoxCreated }: { isOpen: boolean; onClose: () => void; onBoxCreated: () => void; }) => {
  const [boxCode, setBoxCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!boxCode.trim()) {
      setError('Box Code cannot be empty.');
      setLoading(false);
      return;
    }
    try {
      const { error: insertError } = await supabase.from('boxes').insert({ box_code: boxCode.trim(), status: 'available' });
      if (insertError) throw insertError;
      alert('New box created successfully!');
      setBoxCode('');
      onBoxCreated();
      onClose();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Create a New Box</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="boxCode" className="block text-sm font-medium text-gray-700">Box Code</label>
            <input id="boxCode" type="text" value={boxCode} onChange={(e) => setBoxCode(e.target.value.toUpperCase())} placeholder="e.g., D1" required className="w-full p-3 mt-1 bg-white border border-gray-300 rounded-md shadow-sm" />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Creating...' : 'Create Box'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal Component for editing an existing box
const EditBoxModal = ({ box, isOpen, onClose, onBoxUpdated }: { box: Box | null; isOpen: boolean; onClose: () => void; onBoxUpdated: () => void; }) => {
  const [status, setStatus] = useState(box?.status || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (box) {
      setStatus(box.status);
    }
  }, [box]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!box) return;

    try {
      const { error: updateError } = await supabase.from('boxes').update({ status }).eq('id', box.id);
      if (updateError) throw updateError;
      alert('Box status updated successfully!');
      onBoxUpdated();
      onClose();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !box) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Edit Box: {box.box_code}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 mt-1 bg-white border border-gray-300 rounded-md shadow-sm">
              <option value="available">available</option>
              <option value="unavailable">unavailable</option>
              <option value="pending">pending</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function BoxAndRentalsPage() {
  const [activeTab, setActiveTab] = useState('boxes');
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [error, setError] = useState<string|null>(null);

  const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'boxes') {
          const { data, error } = await supabase.rpc('get_all_boxes');
          if (error) throw error;
          setBoxes(data || []);
        } else if (activeTab === 'rentals') {
          const { data, error } = await supabase.rpc('get_all_rentals');
          if (error) throw error;
          setRentals(data || []);
        }
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        console.error(`Error fetching ${activeTab}:`, err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenEditModal = (box: Box) => {
    setEditingBox(box);
    setIsEditModalOpen(true);
  };
  
  const handleEndRental = async (rentalId: string) => {
    if (window.confirm('Are you sure you want to end this rental? This action cannot be undone.')) {
      try {
        const { error: rpcError } = await supabase.rpc('admin_end_rental', { rental_id_input: rentalId });
        if (rpcError) throw rpcError;
        alert('Rental has been successfully ended.');
        await fetchData(); // Refresh data
      } catch (err) {
        if (err instanceof Error) alert(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div>
      <CreateBoxModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onBoxCreated={fetchData} />
      <EditBoxModal box={editingBox} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onBoxUpdated={fetchData} />

      <h1 className="text-3xl font-bold text-gray-800 mb-6">Box & Rental Management</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('boxes')} className={`${activeTab === 'boxes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Boxes</button>
          <button onClick={() => setActiveTab('rentals')} className={`${activeTab === 'rentals' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Rentals</button>
        </nav>
      </div>
      <div>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500 p-4 bg-red-50 rounded-md">{error}</p>}
        {!loading && activeTab === 'boxes' && (
          <div>
            <div className="flex justify-end mb-4"><button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">+ Create New Box</button></div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Box Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {boxes.map((box) => (
                    <tr key={box.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{box.box_code}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><StatusBadge status={box.status} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => handleOpenEditModal(box)} className="text-blue-600 hover:text-blue-900">Edit</button></td>
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
                      {rental.status.toLowerCase() === 'active' && (
                        <button onClick={() => handleEndRental(rental.rental_id)} className="text-red-600 hover:text-red-900">End Rental</button>
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