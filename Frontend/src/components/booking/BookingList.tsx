import React from 'react';
import { TableBooking } from '../../types/booking';
import { format } from 'date-fns';

interface BookingListProps {
  bookings: TableBooking[];
}

export default function BookingList({ bookings }: BookingListProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return format(new Date().setHours(Number(hours), Number(minutes)), 'h:mm a');
    } catch (error) {
      return timeString;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings found</p>
      ) : (
        bookings.map((booking) => (
          <div
            key={booking.id}
            className="bg-white p-4 rounded-lg shadow border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">
                  {formatDate(booking.booking_date)} at {formatTime(booking.booking_time)}
                </p>
                <p className="text-gray-600">Party of {booking.number_of_guests}</p>
                {booking.special_requests && (
                  <p className="text-gray-500 text-sm mt-2">
                    Note: {booking.special_requests}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-sm ${
                booking.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : booking.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
} 