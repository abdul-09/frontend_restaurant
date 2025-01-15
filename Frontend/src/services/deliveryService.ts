import axiosInstance from '../utils/axios';
import { DeliveryZone, DeliveryOrder, DeliveryStatus } from '../types/delivery';

class DeliveryService {
  private static instance: DeliveryService;

  private constructor() {}

  static getInstance(): DeliveryService {
    if (!DeliveryService.instance) {
      DeliveryService.instance = new DeliveryService();
    }
    return DeliveryService.instance;
  }

  async getActiveDeliveries(driverId?: string): Promise<DeliveryOrder[]> {
    try {
      const response = await axiosInstance.get('/deliveries/active', {
        params: { driverId },
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch active deliveries');
    }
  }

  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    location?: { lat: number; lng: number }
  ): Promise<DeliveryOrder> {
    try {
      const response = await axiosInstance.patch(`/deliveries/${deliveryId}`, {
        status,
        location,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update delivery status');
    }
  }

  async getDeliveryZones(): Promise<DeliveryZone[]> {
    try {
      const response = await axiosInstance.get('/delivery-zones');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch delivery zones');
    }
  }

  async assignDriver(deliveryId: string, driverId: string): Promise<DeliveryOrder> {
    try {
      const response = await axiosInstance.post(`/deliveries/${deliveryId}/assign`, {
        driverId,
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to assign driver');
    }
  }
}

export default DeliveryService.getInstance();