import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DeliveryStatus } from '../types/delivery';
import deliveryService from '../services/deliveryService';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

export function useDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: activeDeliveries, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['deliveries', 'active', user?.id],
    queryFn: () => deliveryService.getActiveDeliveries(user?.role === 'delivery' ? user.id : undefined),
    enabled: !!user?.id,
  });

  const { data: deliveryZones } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => deliveryService.getDeliveryZones(),
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: ({
      deliveryId,
      status,
      location,
    }: {
      deliveryId: string;
      status: DeliveryStatus;
      location?: { lat: number; lng: number };
    }) => deliveryService.updateDeliveryStatus(deliveryId, status, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Delivery status updated');
    },
    onError: () => {
      toast.error('Failed to update delivery status');
    },
  });

  const assignDriver = useMutation({
    mutationFn: ({
      deliveryId,
      driverId,
    }: {
      deliveryId: string;
      driverId: string;
    }) => deliveryService.assignDriver(deliveryId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Driver assigned successfully');
    },
    onError: () => {
      toast.error('Failed to assign driver');
    },
  });

  return {
    activeDeliveries,
    isLoadingDeliveries,
    deliveryZones,
    updateDeliveryStatus,
    assignDriver,
  };
}