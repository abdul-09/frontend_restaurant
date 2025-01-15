import { create } from 'zustand';
import { CartStore, Cart, CartItem } from '../types/cart';

import { calculateCartTotals } from '../utils/priceCalculations';

const initialCart: Cart = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};

export const useCartStore = create<CartStore>((set) => ({
  cart: initialCart,
  
  setCart: (cart: Cart) => set({ cart }),
  
  addItem: (item: CartItem) => 
    set((state) => {
      const existingItemIndex = state.cart.items.findIndex((cartItem) => cartItem.id === item.id);
      
      let updatedItems;
      if (existingItemIndex !== -1) {
        updatedItems = state.cart.items.map((cartItem, index) =>
          index === existingItemIndex ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem
        );
      } else {
        updatedItems = [...state.cart.items, item];
      }

      const { subtotal, tax, total } = calculateCartTotals(updatedItems);
      
      return {
        cart: {
          ...state.cart,
          items: updatedItems,
          subtotal,
          tax,
          total,
        },
      };
    }),
    
  removeItem: (itemId: string) =>
    set((state) => {
      const updatedItems = state.cart.items.filter((item) => item.id !== itemId);
      const { subtotal, tax, total } = calculateCartTotals(updatedItems);
      
      return {
        cart: {
          ...state.cart,
          items: updatedItems,
          subtotal,
          tax,
          total,
        },
      };
    }),
    
  updateQuantity: (itemId: string, quantity: number) =>
    set((state) => {
      const updatedItems = state.cart.items.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      const { subtotal, tax, total } = calculateCartTotals(updatedItems);
      
      return {
        cart: {
          ...state.cart,
          items: updatedItems,
          subtotal,
          tax,
          total,
        },
      };
    }),
    
  clearCart: () => set({ cart: initialCart }),

  addSpecialInstructions: (itemId: string, instructions: string) =>
    set((state) => ({
      cart: {
        ...state.cart,
        items: state.cart.items.map((item) =>
          item.id === itemId ? { ...item, specialInstructions: instructions } : item
        ),
      },
    })),
}));