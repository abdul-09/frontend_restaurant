import axiosInstance from '../utils/axios';
import { Order, OrderStatus, CreateOrder, OrderResponse } from '../types/order';

class OrderService {
  private static instance: OrderService;

  private constructor() {}

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }
  

  async createOrder(orderData: CreateOrder): Promise<OrderResponse> {
    try {
      const response = await axiosInstance.post('api/v1/orders/', orderData);
      const createdOrder = response.data;  // Access the `order` key
      console.log("from oderservice: ", createdOrder)
      return createdOrder;
      // return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const response = await axiosInstance.get('api/v1/orders/');
      console.log('Orders response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await axiosInstance.get(`api/v1/orders/${orderId}/`);
      return response.data;
    } catch (error) {
      console.error(error)
      throw new Error('Failed to fetch order');
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    try {
      const response = await axiosInstance.patch(`api/v1/orders/${orderId}/`, { status });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update order status');
      console.error(error)
    }
  }

  async cancelOrder(orderId: string | number): Promise<Order> {
    try {
      const response = await axiosInstance.patch(`api/v1/orders/${orderId}/`, {
        status: 'cancelled'
      });
      return response.data;
    } catch (error) {
      console.error(error)
      throw new Error('Failed to cancel order');
    }
  }
}

export default OrderService.getInstance();