export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'cash' | 'wallet';
export type DeliveryType = 'delivery' | 'pickup' | 'dine-in';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
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

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  delivery: DeliveryInfo;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStore {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  createOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  fetchOrders: () => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
}