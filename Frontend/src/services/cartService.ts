import { CartItem, Cart } from '../types/cart';
import axiosInstance from '../utils/axios';
import axios from 'axios';

class CartService {
  private static instance: CartService;

  private constructor() {}

  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  async getCart(): Promise<Cart> {
    try {
      const response = await axiosInstance.get('api/v1/cart/');
      console.log('Cart:', response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to fetch cart');
    }
  }

  async addToCart(item: Omit<CartItem, 'id'>, updateStore?: (cart: Cart) => void): Promise<Cart> {
    try {
      console.log('Sending data to backend:', item);
      const response = await axiosInstance.post('api/v1/cart/', {
        menuitem: item.menuitem,
        quantity: item.quantity,
      });
      
      if (updateStore) {
        updateStore(response.data);
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
        throw new Error(error.response.data.detail || 'Failed to add item to cart');
      }
      throw new Error('Failed to add item to cart');
    }
  }

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    try {
      const response = await axiosInstance.patch(`api/v1/cart/${itemId}/`, {
        quantity: quantity
      });
      console.log('Updated quantity:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update quantity:', error);
      throw error;
    }
  }

  async removeItem(itemId: string): Promise<void> {
    try {
      await axiosInstance.delete(`api/v1/cart/${itemId}/`);
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw new Error('Failed to remove item');
    }
  }

  async clearCart(): Promise<void> {
    try {
      await axiosInstance.delete('api/v1/cart/');
    } catch (error) {
      console.error(error);
      throw new Error('Failed to clear cart');
    }
  }

  async addSpecialInstructions(itemId: string, instructions: string): Promise<Cart> {
    try {
      const response = await axiosInstance.patch(`api/v1/cart/${itemId}/`, {
        specialInstructions: instructions,
      });
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error('Failed to add special instructions');
    }
  }
}

export default CartService.getInstance();