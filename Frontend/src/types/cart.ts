
export interface CartItem {
  id: string;
  menuitem: number;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  image: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  deliveryFee?: number;
}

export interface CartStore {
  cart: Cart;
  setCart: (cart: Cart) => void;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  addSpecialInstructions: (itemId: string, instructions: string) => void;
}