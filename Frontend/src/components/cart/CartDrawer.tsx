import { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const { cart, removeItem, updateQuantity } = useCartStore();
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'dine-in'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dineInTable, setDineInTable] = useState('');

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <div className="w-screen max-w-md">
          <div className="flex h-full flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              {cart.items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        
                        <div className="mt-2 flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="p-1 text-gray-400 hover:text-gray-500"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-gray-600">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-gray-400 hover:text-gray-500"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.items.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span>${cart.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <span>Total</span>
                    <span>${cart.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Delivery Type</label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value as 'delivery' | 'pickup' | 'dine-in')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="delivery">Delivery</option>
                    <option value="pickup">Pickup</option>
                    <option value="dine-in">Dine-in</option>
                  </select>
                </div>

                {deliveryType === 'delivery' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter your delivery address"
                    />
                  </div>
                )}

                {deliveryType === 'pickup' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter pickup location"
                    />
                  </div>
                )}

                {deliveryType === 'dine-in' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Table Number</label>
                    <input
                      type="text"
                      value={dineInTable}
                      onChange={(e) => setDineInTable(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Enter table number"
                    />
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  className="mt-6 w-full bg-indigo-600 px-4 py-3 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}