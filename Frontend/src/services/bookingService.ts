import axiosInstance from '../utils/axios';
import { TableBooking, BookingStatus, Table, BookingFormData } from '../types/booking';

class BookingService {
  private static instance: BookingService;
  private readonly baseUrl = '/api/v1';

  private constructor() {}

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  // Get all tables
  async getTables(): Promise<Table[]> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tables/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tables:', error);
      throw new Error('Failed to fetch tables');
    }
  }

  // Get a specific table
  async getTable(tableId: string): Promise<Table> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/tables/${tableId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching table:', error);
      throw new Error('Failed to fetch table');
    }
  }

  // Get available tables for booking
  async getAvailableTables(date: string, time: string, guests: number): Promise<Table[]> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/table-bookings/available_tables/`, {
        params: { date, time, guests },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available tables:', error);
      throw new Error('Failed to fetch available tables');
    }
  }

  // Get all bookings
  async getBookings(): Promise<TableBooking[]> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/table-bookings/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  // Get a specific booking
  async getBooking(bookingId: string): Promise<TableBooking> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}/table-bookings/${bookingId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw new Error('Failed to fetch booking');
    }
  }

  // Create a new booking
  async createBooking(bookingData: BookingFormData): Promise<TableBooking> {
    try {
      const response = await axiosInstance.post(`${this.baseUrl}/table-bookings/`, bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  // Update a booking
  async updateBooking(bookingId: string, data: Partial<TableBooking>): Promise<TableBooking> {
    try {
      const response = await axiosInstance.patch(`${this.baseUrl}/table-bookings/${bookingId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw new Error('Failed to update booking');
    }
  }

  // Delete a booking
  async deleteBooking(bookingId: string): Promise<void> {
    try {
      await axiosInstance.delete(`${this.baseUrl}/table-bookings/${bookingId}/`);
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw new Error('Failed to delete booking');
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<TableBooking> {
    return this.updateBooking(bookingId, { status });
  }
}

export default BookingService.getInstance();