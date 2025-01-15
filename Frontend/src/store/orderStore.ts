import { create } from 'zustand';
import { OrderStore, CreateOrder } from '../types/order';
import orderService from '../services/orderService';
import { useAuthStore } from './authStore';

export const useOrderStore = create<OrderStore>((set) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  createOrder: async (orderData: CreateOrder) => {
    try {
      set({ isLoading: true, error: null });
      // const createdOrder = await orderService.createOrder(orderData);
      const { order } = await orderService.createOrder(orderData);
      set((state) => ({
        orders: [order, ...state.orders],
        currentOrder: order,
      }));
      
      return { message: 'Order created successfully', order };
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
      const orders = await orderService.getOrders();
      const userId = useAuthStore.getState().user?.id;

      console.log('User ID:', userId);
      console.log('Fetched Orders:', orders);

      const userOrders = userId 
        ? orders.filter(order => {
            console.log('Order Customer ID:', order.customer.id);
            return order.customer?.id.toString() === userId.toString();
          })
        : [];
        
      console.log('Fetched user orders:', userOrders);
      set({ orders: userOrders });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
      set({ error: errorMessage });
      console.error('Error fetching orders:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  cancelOrder: async (orderId) => {
    try {
      set({ isLoading: true, error: null });
      const updatedOrder = await orderService.cancelOrder(orderId);
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === orderId ? updatedOrder : order
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