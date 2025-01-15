import { useEffect, useState } from 'react';
import BookingForm from '../components/booking/BookingForm';
import BookingList from '../components/booking/BookingList';
import { TableBooking } from '../types/booking';
import bookingService from '../services/bookingService';
import { toast } from 'react-hot-toast';

export default function BookingPage() {
  const [bookings, setBookings] = useState<TableBooking[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingService.getBookings();
        setBookings(data);
      } catch (error) {
        toast.error('Failed to fetch bookings');
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Table Reservation</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Make a Reservation</h2>
          <BookingForm />
        </div>
        
        <div>
          <BookingList bookings={bookings} />
        </div>
      </div>
    </div>
  );
}