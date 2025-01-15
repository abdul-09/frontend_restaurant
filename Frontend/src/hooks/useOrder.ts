import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateOrder, OrderStatus } from '../types/order';
import orderService from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

export function useOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => orderService.getOrders(),
    enabled: !!user?.id,
  });

  // const createOrder = useMutation({
  //   mutationFn: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) =>
  //     orderService.createOrder(orderData),
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['orders'] });
  //     toast.success('Order placed successfully');
  //   },
  //   onError: () => {
  //     toast.error('Failed to place order');
  //   },
  // });

  const createOrder = useMutation({
    mutationFn: (orderData: CreateOrder) =>
      orderService.createOrder(orderData),
    onSuccess: (data) => {
      const { order } = data;
      console.log('Created order ID:', order.id); // Log the created order
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order placed successfully');
    },
    onError: () => {
      toast.error('Failed to place order');
    },
  });
  

  const updateOrderStatus = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update order status');
    },
  });

  const cancelOrder = useMutation({
    mutationFn: (orderId: string) => orderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel order');
    },
  });

  return {
    orders,
    isLoadingOrders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
  };
}