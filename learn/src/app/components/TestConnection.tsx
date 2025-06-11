"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [boxCount, setBoxCount] = useState<number | null>(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Try to fetch the count of boxes
        const { count, error } = await supabase
          .from('boxes')
          .select('*', { count: 'exact' });

        if (error) {
          throw error;
        }

        setBoxCount(count);
        setStatus('success');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setStatus('error');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-4 rounded-lg border">
      <h3 className="text-lg font-medium mb-2">Database Connection Status:</h3>
      {status === 'loading' && (
        <p className="text-blue-600">Testing connection...</p>
      )}
      {status === 'success' && (
        <div>
          <p className="text-green-600">✓ Connected successfully</p>
          <p className="text-sm text-gray-600 mt-1">Found {boxCount} boxes in the database</p>
        </div>
      )}
      {status === 'error' && (
        <div>
          <p className="text-red-600">✗ Connection failed</p>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
} 