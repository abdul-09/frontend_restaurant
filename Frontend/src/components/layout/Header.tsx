import React, { useState } from 'react';
import { Bell, User, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import CartDrawer from '../cart/CartDrawer';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </button>

          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full">
            <Bell className="w-6 h-6" />
          </button>
          
          <div className="relative">
            <button className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg">
              <User className="w-6 h-6 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user?.lastName}
              </span>
            </button>
          </div>
          
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}