// import React from 'react';
import { CartItem as CartItemType } from '../../types/cart';
import { useCartStore } from '../../store/cartStore';
import { Plus, Minus, Trash2 } from 'lucide-react';
import cartService from '../../services/cartService';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { calculateItemTotal } from '../../utils/priceCalculations';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const {  removeItem, setCart } = useCartStore();
  const queryClient = useQueryClient();

  const handleUpdateQuantity = async (newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        return;
      }
      
      const updatedCart = await cartService.updateQuantity(item.id, newQuantity);
      setCart(updatedCart);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Quantity updated');
    } catch (error) {
      toast.error('Failed to update quantity');
      console.error(error);
    }
  };

  const handleRemoveItem = async () => {
    try {
      await cartService.removeItem(item.id);
      removeItem(item.id);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
      console.error(error);
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">
          {item.name || 'Unnamed Item'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          ${calculateItemTotal(item).toFixed(2)}
        </p>
        
        <div className="mt-2 flex items-center space-x-2">
          <button
            onClick={() => item.quantity > 1 ? handleUpdateQuantity(item.quantity - 1) : handleRemoveItem()}
            className="p-1 text-gray-400 hover:text-gray-500"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-gray-600">{item.quantity}</span>
          <button
            onClick={() => handleUpdateQuantity(item.quantity + 1)}
            className="p-1 text-gray-400 hover:text-gray-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <button
        onClick={handleRemoveItem}
        className="text-gray-400 hover:text-gray-500"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}