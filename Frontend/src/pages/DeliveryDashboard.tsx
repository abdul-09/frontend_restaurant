import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '../components/ui/Loader';
import axiosInstance from '../utils/axios';

interface DeliveryOrder {
  id: number;
  customer: {
    first_name: string;
    last_name: string;
  };
  status: 'pending' | 'in_transit' | 'delivered';
  created: string;
  delivery_address: string;
  total: number;
}

const fetchDeliveryOrders = async () => {
  const response = await axiosInstance.get('/api/v1/delivery-orders/');
  return response.data;
};

export default function DeliveryDashboard() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['deliveryOrders'],
    queryFn: fetchDeliveryOrders,
  });

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await axiosInstance.patch(`/api/v1/orders/${orderId}/`, {
        status: newStatus,
      });
      // Refetch orders after update
      // queryClient.invalidateQueries(['deliveryOrders']);
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <div>Error loading delivery orders</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Delivery Dashboard</h1>
      
      <div className="grid gap-6">
        {orders?.map((order: DeliveryOrder) => (
          <div key={order.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Order #{order.id}
                </h3>
                <p className="text-gray-600">
                  {order.customer.first_name} {order.customer.last_name}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-semibold">${order.total}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  order.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Delivery Address:</h4>
              <p className="text-gray-600">{order.delivery_address}</p>
            </div>
            
            <div className="flex gap-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate(order.id, 'in_transit')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Start Delivery
                </button>
              )}
              {order.status === 'in_transit' && (
                <button
                  onClick={() => handleStatusUpdate(order.id, 'delivered')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Mark as Delivered
                </button>
              )}
            </div>
          </div>
        ))}
        
        {orders?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No delivery orders available at the moment.
          </div>
        )}
      </div>
    </div>
  );
} 