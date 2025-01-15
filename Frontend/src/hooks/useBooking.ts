import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookingFormData, TableBooking, BookingStatus } from '../types/booking';
import bookingService from '../services/bookingService';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

export function useBooking() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => bookingService.getBookings(user?.id || ''),
    enabled: !!user?.id,
  });

  const createBooking = useMutation({
    mutationFn: (data: BookingFormData) =>
      bookingService.createBooking({ ...data, userId: user?.id || '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created successfully');
    },
    onError: () => {
      toast.error('Failed to create booking');
    },
  });

  const updateBookingStatus = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: BookingStatus }) =>
      bookingService.updateBooking(bookingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking updated successfully');
    },
    onError: () => {
      toast.error('Failed to update booking');
    },
  });

  return {
    bookings,
    isLoadingBookings,
    createBooking,
    updateBookingStatus,
  };
}