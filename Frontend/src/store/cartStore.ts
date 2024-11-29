import { create } from 'zustand';
import { CartStore, Cart, CartItem } from '../types/cart';

const calculateTotals = (items: CartItem[]): { subtotal: number; tax: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax;
  
  return { subtotal, tax, total };
};

const initialCart: Cart = {
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
};

export const useCartStore = create<CartStore>((set) => ({
  cart: initialCart,
  
  addItem: (newItem) => set((state) => {
    const existingItem = state.cart.items.find(item => item.menuItemId === newItem.menuItemId);
    
    let updatedItems;
    if (existingItem) {
      updatedItems = state.cart.items.map(item =>
        item.menuItemId === newItem.menuItemId
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item
      );
    } else {
      updatedItems = [...state.cart.items, newItem];
    }
    
    return {
      cart: {
        items: updatedItems,
        ...calculateTotals(updatedItems),
      },
    };
  }),
  
  removeItem: (itemId) => set((state) => {
    const updatedItems = state.cart.items.filter(item => item.id !== itemId);
    return {
      cart: {
        items: updatedItems,
        ...calculateTotals(updatedItems),
      },
    };
  }),
  
  updateQuantity: (itemId, quantity) => set((state) => {
    const updatedItems = state.cart.items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    return {
      cart: {
        items: updatedItems,
        ...calculateTotals(updatedItems),
      },
    };
  }),
  
  addSpecialInstructions: (itemId, instructions) => set((state) => ({
    cart: {
      ...state.cart,
      items: state.cart.items.map(item =>
        item.id === itemId ? { ...item, specialInstructions: instructions } : item
      ),
    },
  })),
  
  clearCart: () => set({ cart: initialCart }),
}));