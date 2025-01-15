import React from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';
import { useDelivery } from '../../hooks/useDelivery';
import { DeliveryOrder } from '../../types/delivery';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-purple-100 text-purple-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

interface DeliveryCardProps {
  delivery: DeliveryOrder;
  onStatusUpdate: (deliveryId: string, status: DeliveryOrder['status']) => void;
}

function DeliveryCard({ delivery, onStatusUpdate }: DeliveryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium text-gray-900">Order #{delivery.orderId}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[delivery.status]}`}>
          {delivery.status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Pickup</p>
            <p className="text-sm text-gray-600">{delivery.pickupAddress}</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-700">Delivery</p>
            <p className="text-sm text-gray-600">{delivery.deliveryAddress}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-gray-400" />
          <p className="text-sm text-gray-600">
            Estimated delivery by {delivery.estimatedDeliveryTime}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Phone className="w-5 h-5 text-gray-400" />
          <p className="text-sm text-gray-600">{delivery.customerPhone}</p>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        {delivery.status === 'pending' && (
          <button
            onClick={() => onStatusUpdate(delivery.id, 'assigned')}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Accept Delivery
          </button>
        )}
        {delivery.status === 'assigned' && (
          <button
            onClick={() => onStatusUpdate(delivery.id, 'picked_up')}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Mark as Picked Up
          </button>
        )}
        {delivery.status === 'picked_up' && (
          <button
            onClick={() => onStatusUpdate(delivery.id, 'in_transit')}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Start Delivery
          </button>
        )}
        {delivery.status === 'in_transit' && (
          <button
            onClick={() => onStatusUpdate(delivery.id, 'delivered')}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Complete Delivery
          </button>
        )}
      </div>
    </div>
  );
}

export default function DeliveryQueue() {
  const { activeDeliveries, isLoadingDeliveries, updateDeliveryStatus } = useDelivery();

  const handleStatusUpdate = (deliveryId: string, status: DeliveryOrder['status']) => {
    updateDeliveryStatus.mutate({ deliveryId, status });
  };

  if (isLoadingDeliveries) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeDeliveries?.map((delivery) => (
        <DeliveryCard
          key={delivery.id}
          delivery={delivery}
          onStatusUpdate={handleStatusUpdate}
        />
      ))}
      {activeDeliveries?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No active deliveries</p>
        </div>
      )}
    </div>
  );
}