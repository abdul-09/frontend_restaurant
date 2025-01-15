export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'cash' | 'wallet';
export type DeliveryType = 'delivery' | 'pickup' | 'dine-in';

export interface OrderItem {
  id: string;
  menuitem: number;
  name: string;
  price: string;
  quantity: number;
  specialInstructions?: string;
}

export interface DeliveryInfo {
  type: DeliveryType;
  address?: string;
  contactNumber: string;
  instructions?: string;
  preferredTime?: string;
}

export interface Customer {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface Order {
  id: string;
  reference: string;
  customer: Customer;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: string;
  tax: string;
  deliveryFee: string;
  total: string;
  paymentMethod: PaymentMethod;
  delivery: DeliveryInfo;
  created: string;
  updated: string;
}

export interface OrderResponse {
  message: string;
  order: Order;
}

export interface CreateOrderItem {
  menuitem: number;
  quantity: number;
  price: number;
  specialInstructions: string;
}

export interface CreateOrder {
  customer: number;
  items: CreateOrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  delivery: DeliveryInfo;
}

export interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  createOrder: (order: CreateOrder) => Promise<OrderResponse>;
  fetchOrders: () => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}