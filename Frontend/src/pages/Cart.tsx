import React from 'react';
import CartSummary from '../components/cart/CartSummary';
import CartItem from '../components/cart/CartItem';
import { useCart } from '../hooks/useCart';

export default function Cart() {
  const { cart, isLoading } = useCart();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return <div>Your cart is empty</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      <div className="space-y-4">
        {cart.items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
      <CartSummary />
    </div>
  );
}