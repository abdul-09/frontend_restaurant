import { useEffect } from 'react';
import { Clock, MapPin, Truck, Store, Users, Ban } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useOrderStore } from '../store/orderStore';
import { Order, OrderStatus } from '../types/order';
import { useAuthStore } from '../store/authStore';

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    delivered: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const DeliveryIcon = ({ type }: { type: Order['delivery']['type'] }) => {
  switch (type) {
    case 'delivery':
      return <Truck className="w-5 h-5 text-gray-500" />;
    case 'pickup':
      return <Store className="w-5 h-5 text-gray-500" />;
    case 'dine-in':
      return <Users className="w-5 h-5 text-gray-500" />;
  }
};

// Add a utility function for date formatting
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    // Assuming the date string is in ISO format from the backend
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export default function Orders() {
  const { user } = useAuthStore();
  const { orders, isLoading, error, fetchOrders, cancelOrder } = useOrderStore();

  useEffect(() => {
    if (user?.id) {
      console.log('Fetching orders for user:', user.id);
      fetchOrders();
    }
  }, [user?.id, fetchOrders]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel order');
      console.error('Cancel order error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading orders: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Orders</h1>

      <div className="space-y-6">
        {orders && orders.length > 0 ? (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <DeliveryIcon type={order.delivery.type} />
                    <div>
                      <p className="text-sm text-gray-500">
                        Order #{order.reference?.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(order.created)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="border-t border-b border-gray-100 py-4 mb-4">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-gray-900">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {order.delivery.type === 'delivery' && order.delivery.address && (
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {order.delivery.address}
                      </div>
                    )}
                    {order.delivery.preferredTime && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {order.delivery.preferredTime}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    <p className="text-lg font-semibold text-gray-900">
                      ${parseFloat(order.total).toFixed(2)}
                    </p>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}