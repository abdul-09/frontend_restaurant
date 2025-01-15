// import React from 'react';
import { Clock, MapPin, Ban } from 'lucide-react';
import { useOrder } from '../../hooks/useOrder';
import { Order } from '../../types/order';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

interface OrderCardProps {
  order: Order;
  onCancel: (orderId: string) => void;
}

function OrderCard({ order, onCancel }: OrderCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Order #{order.reference.slice(0, 8)}
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            statusColors[order.status]
          }`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <div className="space-y-4">
        <div className="border-t border-gray-100 pt-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2">
              <span className="text-sm text-gray-600">
                {item.quantity}x {item.name}
              </span>
              <span className="text-sm text-gray-900">
                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {order.delivery && (
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {order.delivery.type === 'delivery' ? 'Delivery Address' : 'Pickup Location'}
              </p>
              <p className="text-sm text-gray-600">
                {order.delivery.type === 'delivery'
                  ? order.delivery.address
                  : 'Restaurant Location'}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-gray-400" />
          <p className="text-sm text-gray-600">
            {order.delivery?.preferredTime || 'As soon as possible'}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">${parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-gray-600">Tax</span>
            <span className="text-gray-900">${parseFloat(order.tax).toFixed(2)}</span>
          </div>
          {order.delivery?.type === 'delivery' && (
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="text-gray-900">${parseFloat(order.deliveryFee).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-medium mt-4">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">${parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>

        {order.status === 'pending' && (
          <button
            onClick={() => onCancel(order.id)}
            className="mt-4 w-full flex items-center justify-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
          >
            <Ban className="w-4 h-4" />
            <span>Cancel Order</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrderList() {
  const { orders, isLoadingOrders, cancelOrder } = useOrder();

  const handleCancelOrder = (orderId: string) => {
    cancelOrder.mutate(orderId);
  };

  if (isLoadingOrders) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders?.map((order) => (
        <OrderCard key={order.id} order={order} onCancel={handleCancelOrder} />
      ))}
      {orders?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  );
}