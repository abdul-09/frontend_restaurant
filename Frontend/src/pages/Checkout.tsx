import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPin, Clock, CreditCard, Truck, Store, Users } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { DeliveryType, PaymentMethod } from '../types/order';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const orderData = {
        items: cart.items.map(({ id, menuItemId, name, price, quantity, specialInstructions }) => ({
          id,
          menuItemId,
          name,
          price,
          quantity,
          specialInstructions,
        })),
        subtotal: cart.subtotal,
        tax: cart.tax,
        deliveryFee: deliveryType === 'delivery' ? 5 : 0,
        total: cart.total + (deliveryType === 'delivery' ? 5 : 0),
        paymentMethod,
        delivery: {
          type: deliveryType,
          address: deliveryType === 'delivery' ? address : undefined,
          contactNumber,
          instructions,
          preferredTime,
        },
        status: 'pending',
        userId: 'current-user-id', // This should come from auth store
      };

      await createOrder(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setDeliveryType('delivery')}
              className={`p-4 border rounded-lg flex flex-col items-center ${
                deliveryType === 'delivery' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <Truck className="w-6 h-6 text-gray-600 mb-2" />
              <span className="font-medium">Delivery</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType('pickup')}
              className={`p-4 border rounded-lg flex flex-col items-center ${
                deliveryType === 'pickup' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <Store className="w-6 h-6 text-gray-600 mb-2" />
              <span className="font-medium">Pickup</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryType('dine-in')}
              className={`p-4 border rounded-lg flex flex-col items-center ${
                deliveryType === 'dine-in' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <Users className="w-6 h-6 text-gray-600 mb-2" />
              <span className="font-medium">Dine-in</span>
            </button>
          </div>
        </div>

        {deliveryType === 'delivery' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10 w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Timing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="time"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="pl-10 w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 p-4 border rounded-lg flex items-center justify-center space-x-2 ${
                  paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 p-4 border rounded-lg flex items-center justify-center space-x-2 ${
                  paymentMethod === 'cash' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                }`}
              >
                <span>Cash</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-gray-600">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">${cart.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Tax</span>
                <span className="text-gray-900">${cart.tax.toFixed(2)}</span>
              </div>
              {deliveryType === 'delivery' && (
                <div className="flex justify-between mt-2">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="text-gray-900">$5.00</span>
                </div>
              )}
              <div className="flex justify-between mt-2 text-lg font-semibold">
                <span>Total</span>
                <span>${(cart.total + (deliveryType === 'delivery' ? 5 : 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Place Order
        </button>
      </form>
    </div>
  );
}