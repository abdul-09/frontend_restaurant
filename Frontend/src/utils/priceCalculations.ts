import { CartItem } from '../types/cart';

export const calculateItemTotal = (item: CartItem): number => {
  return item.price * item.quantity;
};

export const calculateCartTotals = (items: CartItem[]) => {
  let subtotal = 0;
  
  for (const item of items) {
    subtotal += item.price * item.quantity;
  }
  
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total
  };
}; 