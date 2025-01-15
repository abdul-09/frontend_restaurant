// import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { calculateCartTotals, calculateItemTotal } from '../../utils/priceCalculations';

export default function CartSummary() {
  const navigate = useNavigate();
  const { cart } = useCartStore();

  if (!cart || !cart.items) return null;

  const { subtotal, tax, total } = calculateCartTotals(cart.items);
  console.log(subtotal, tax, total)
  const deliveryFee = cart.deliveryFee || 0;
  const finalTotal = total + deliveryFee;

  return (
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
            ${calculateItemTotal(item).toFixed(2)}
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
            <span>${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => navigate('/checkout')}
        className="mt-6 w-full bg-indigo-600 px-4 py-3 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
        disabled={cart.items.length === 0}
      >
        <span>Proceed to Checkout</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}