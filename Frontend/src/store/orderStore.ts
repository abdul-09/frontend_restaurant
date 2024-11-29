import { create } from 'zustand';
import { OrderStore, Order } from '../types/order';
import axiosInstance from '../utils/axios';

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  createOrder: async (orderData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.post('api/v1/orders/', orderData);
      set((state) => ({
        orders: [response.data, ...state.orders],
        currentOrder: response.data,
      }));
    } catch (error) {
      set({ error: 'Failed to create order' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchOrders: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.get('api/v1/orders/');
      set({ orders: response.data });
    } catch (error) {
      set({ error: 'Failed to fetch orders' });
      console.error(error)
    } finally {
      set({ isLoading: false });
    }
  },

  cancelOrder: async (orderId) => {
    try {
      set({ isLoading: true, error: null });
      await axiosInstance.patch(`api/v1/orders/${orderId}/`, { status: 'cancelled' });
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        ),
      }));
    } catch (error) {
      set({ error: 'Failed to cancel order' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));