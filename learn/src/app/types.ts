// Common types used across the application

export interface User {
    id: string;
    full_name: string;
    email: string;
    is_admin: boolean;
    created_at: string;
  }
  
  export interface Box {
    id: string;
    box_code: string;
    status: 'available' | 'pending' | 'rented' | 'maintenance';
    items_type?: string;
  }
  
  export interface Rental {
    id: string;
    user_id: string;
    box_id: string;
    start_date: string | null;
    end_date: string | null;
    status: '' | 'active' | 'completed' | 'cancelled';
    price: number;
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    pin_code: string;
    barcode?: string;
    created_at: string;
    items_type: string;
  }
  
  export interface Payment {
    id: string;
    rental_id: string;
    amount: number;
    payment_date: string;
    method: 'credit_card' | 'bank_transfer' | 'digital_wallet' | 'cash';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
  }
  
  // Duration mapping for rental periods
  export const DURATION_OPTIONS = [
    { value: 'one_day', label: 'One day', days: 1 },
    { value: 'three_days', label: 'Three days', days: 3 },
    { value: 'one_week', label: 'One week', days: 7 },
    { value: 'one_month', label: 'One month', days: 30 },
  ];
  
  // Price configuration based on duration
  export const DURATION_PRICES: Record<string, number> = {
    one_day: 5.99,
    three_days: 14.99,
    one_week: 29.99,
    one_month: 99.99,
  };
  
  // Helper function to calculate end date based on duration
  export const calculateEndDate = (startDate: Date, durationValue: string): Date => {
    const endDate = new Date(startDate);
    const duration = DURATION_OPTIONS.find(option => option.value === durationValue);
    
    if (duration) {
      endDate.setDate(startDate.getDate() + duration.days);
    } else {
      // Default to one day if duration not found
      endDate.setDate(startDate.getDate() + 1);
    }
    
    return endDate;
  };