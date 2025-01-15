import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, Table as TableIcon } from 'lucide-react';
import { useBooking } from '../../hooks/useBooking';
import { BookingFormData, Table } from '../../types/booking';
import { toast } from 'react-hot-toast';
import bookingService from '../../services/bookingService';
import { useNavigate } from 'react-router-dom';

export default function BookingForm() {
  const { createBooking } = useBooking();
  const navigate = useNavigate();
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [formData, setFormData] = useState<BookingFormData>({
    booking_date: '',
    booking_time: '',
    number_of_guests: 2,
    table: '',
    special_requests: '',
  });

  const fetchAvailableTables = useCallback(async () => {
    if (formData.booking_date && formData.booking_time && formData.number_of_guests) {
      try {
        const tables = await bookingService.getAvailableTables(
          formData.booking_date,
          formData.booking_time,
          formData.number_of_guests
        );
        setAvailableTables(tables);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to fetch available tables');
      }
    }
  }, [formData.booking_date, formData.booking_time, formData.number_of_guests]);

  useEffect(() => {
    fetchAvailableTables();
  }, [fetchAvailableTables]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.table) {
      toast.error('Please select a table');
      return;
    }
    try {
      await createBooking.mutateAsync(formData);
      toast.success('Table booked successfully!');
      navigate('/menu');
    } catch (error) {
      toast.error('Failed to book table');
      console.error('Error:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Book a Table</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <div className="mt-1 relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={formData.booking_date}
                onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
                className="pl-10 w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Time</label>
            <div className="mt-1 relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="time"
                value={formData.booking_time}
                onChange={(e) => setFormData({ ...formData, booking_time: e.target.value })}
                className="pl-10 w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                min="11:00"
                max="23:00"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
          <div className="mt-1 relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="number"
              min="1"
              max="20"
              value={formData.number_of_guests}
              onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
              className="pl-10 w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {availableTables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Tables</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, table: table.id })}
                  className={`p-4 rounded-lg border ${
                    formData.table === table.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-500'
                  } flex flex-col items-center justify-center space-y-2`}
                >
                  <TableIcon className="w-6 h-6 text-gray-600" />
                  <span className="text-sm font-medium">Table {table.number}</span>
                  <span className="text-xs text-gray-500">Seats {table.capacity}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Special Requests</label>
          <textarea
            value={formData.special_requests}
            onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
            rows={3}
            className="mt-1 w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Any special requests or preferences..."
          />
        </div>

        <button
          type="submit"
          disabled={createBooking.isPending || !formData.table}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {createBooking.isPending ? 'Booking a table...' : 'Book Table'}
        </button>
      </form>
    </div>
  );
}