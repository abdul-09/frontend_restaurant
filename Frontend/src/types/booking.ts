export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  is_available: boolean; 
}

export interface TableBooking {
  id: string;
  customer: string;      
  table: string;         
  booking_date: string;  
  booking_time: string;  
  number_of_guests: number; 
  status: BookingStatus;
  special_requests?: string; 
  created_at: string;    
  updated_at: string;    
}

export interface BookingFormData {
  booking_date: string;  
  booking_time: string;  
  number_of_guests: number; 
  table: string;        
  special_requests?: string; 
}