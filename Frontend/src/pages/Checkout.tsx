import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { MapPin, Clock, CreditCard, Truck, Store, } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useOrderStore } from '../store/orderStore';
import { useAuthStore } from '../store/authStore';
import { DeliveryType, PaymentMethod, CreateOrderItem, CreateOrder } from '../types/order';
// import PaymentService from '../services/paymentService';
import CartService from '../services/cartService';
import PaystackPop from '@paystack/inline-js';
import { PaystackConfig, PaystackResponse } from '../types/payment';
// import { PaystackResponse } from '../types/payment';
// import { v4 as uuidv4 } from 'uuid';

// const generateUniqueReference = (prefix: string = '') => {
//   const timestamp = Date.now();
//   const uuid = uuidv4();
//   return `${prefix}${timestamp}_${uuid}`;
// };

// First, let's define the API response type


export default function Checkout() {
  const navigate = useNavigate();
  const { cart, setCart, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  const { user } = useAuthStore(); 

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = await CartService.getCart();
        setCart(cartData);
      } catch (error) {
        console.error('Failed to load cart:', error);
        toast.error('Failed to load cart');
      }
    };

    loadCart();
  }, [setCart]);

  // Update the calculation functions to be more precise
  const calculateSubtotal = () => {
    return cart.items.reduce((sum, item) => {
      const itemTotal = parseFloat((item.price * item.quantity).toFixed(2));
      return sum + itemTotal;
    }, 0);
  };

  const calculateTax = (subtotal: number) => {
    return parseFloat((subtotal * 0.1).toFixed(2)); // 10% tax
  };

  const calculateDeliveryFee = () => {
    return deliveryType === 'delivery' ? 5 : 0;
  };

  const calculateTotal = (subtotal: number, tax: number, deliveryFee: number) => {
    return parseFloat((subtotal + tax + deliveryFee).toFixed(2));
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax(subtotal);
  const deliveryFee = calculateDeliveryFee();
  const total = calculateTotal(subtotal, tax, deliveryFee);

  useEffect(() => {
    console.log('Cart Items:', cart.items);
    console.log('Calculations:', {
      subtotal,
      tax,
      deliveryFee,
      total
    });
  }, [cart.items, subtotal, tax, deliveryFee, total]);

  const createOrderData = (): CreateOrder | null => {
    if (!user) {
      toast.error('User not authenticated');
      navigate('/login');
      return null;
    }

    const orderItems: CreateOrderItem[] = cart.items.map(item => ({
      menuitem: item.menuitem,
      quantity: item.quantity,
      price: item.price,
      specialInstructions: item.specialInstructions || ''
    }));

    const orderData: CreateOrder = {
      customer: user.id,
      items: orderItems,
      status: 'pending',
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      paymentMethod,
      delivery: {
        type: deliveryType,
        address: deliveryType === 'delivery' ? address : '',
        contactNumber,
        instructions: instructions || '',
        preferredTime: preferredTime || ''
      }
    };

    console.log('Creating order with data:', orderData);
    return orderData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (deliveryType === 'delivery' && !address) {
      toast.error('Delivery address is required');
      return;
    }

    if (!contactNumber) {
      toast.error('Contact number is required');
      return;
    }

    try {
      const orderData = createOrderData();
      if (!orderData) return;

      const response = await createOrder(orderData);
      console.log('API Response:', response);
      const createdOrder = response.order;

      console.log('Created order:', createdOrder);
      
      if (!createdOrder) {
        toast.error('Failed to create order');
        return;
      }

      if (paymentMethod === 'card') {
        const paystackConfig: PaystackConfig = {
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY!,
          email: user.email,
          amount: Math.round(parseFloat(orderData.total.toString()) * 100),
          currency: 'KES',
          ref: `PST-${Date.now()}`,
          metadata: {
            custom_fields: [
              {
                display_name: "Order ID",
                variable_name: "order_id",
                value: createdOrder.id
              }
            ]
          },
          callback: async (response: PaystackResponse) => {
            try {
              if (response.status !== 'success') {
                toast.error('Payment was not successful');
                return;
              }

              const verifyResponse = await fetch(
                `http://127.0.0.1:8000/api/v1/payments/verify/${createdOrder.id}/`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    paystackRef: response.reference,
                    amount: Math.round(parseFloat(orderData.total.toString()) * 100),
                    email: user.email
                  })
                }
              );

              if (!verifyResponse.ok) {
                const errorData = await verifyResponse.json();
                throw new Error(errorData.error || 'Payment verification failed');
              }

              const verifyData = await verifyResponse.json();

              if (verifyData.status === 'success') {
                clearCart();
                toast.success('Order placed and payment successful!');
                navigate('/orders');
              } else {
                toast.error(verifyData.error || 'Payment verification failed');
                console.error('Payment verification failed:', verifyData.error);
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              toast.error(error instanceof Error ? error.message : 'Payment verification failed');
            }
          },
          onClose: () => {
            toast.error('Payment was cancelled');
            // You might want to cancel the order here
            useOrderStore.getState().cancelOrder(createdOrder.id);
            return 'cancelled';
          },
        };

        const paystack = new PaystackPop();
        paystack.newTransaction(paystackConfig);
      } else {
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/orders');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process order');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Method</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {/* <button
              type="button"
              onClick={() => setDeliveryType('dine-in')}
              className={`p-4 border rounded-lg flex flex-col items-center ${
                deliveryType === 'dine-in' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <Users className="w-6 h-6 text-gray-600 mb-2" />
              <span className="font-medium">Dine-in</span>
            </button> */}
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
                    placeholder="Enter your delivery address"
                    className="pl-10 w-full  border-2 border-gray-300 rounded-lg   focus:border-transparent py-2 px-4 bg-gray-50 hover:bg-white transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Timing</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full border-2 border-gray-300 rounded-lg   focus:border-transparent py-2 px-4 bg-gray-50 hover:bg-white transition-colors"
                  required
                />
              </div>
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
                  className="pl-10 w-full border-2 border-gray-300 rounded-lg  focus:border-transparent py-2 px-4 bg-gray-50 hover:bg-white transition-colors"
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
                placeholder="Add any special instructions for your order"
                rows={3}
                className="w-full border-2 border-gray-300 rounded-lg   focus:border-transparent py-2 px-4 bg-gray-50 hover:bg-white transition-colors resize-none"
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

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-4 mb-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700"
        >
          Place Order
        </button>
      </form>
    </div>
  );
}