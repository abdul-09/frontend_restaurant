export type DeliveryStatus = 
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed';

export interface DeliveryZone {
  id: string;
  name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  baseDeliveryFee: number;
  estimatedDeliveryTime: number;
}

export interface DeliveryOrder {
  id: string;
  orderId: string;
  driverId?: string;
  status: DeliveryStatus;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  zone: DeliveryZone;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryMetrics {
  totalDeliveries: number;
  completedDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}