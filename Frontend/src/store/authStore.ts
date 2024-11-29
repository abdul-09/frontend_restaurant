import { create } from 'zustand';
import { authService } from '../services/auth';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'manager' | 'delivery';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    user: User;
    tokens?: { access: string; refresh: string };
  }>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.login(email, password);
      set({ 
        user: result.user,
        isAuthenticated: true,
        isLoading: false 
      });
      return result;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      localStorage.removeItem('accessToken');
      set({ 
        user: null, 
        isAuthenticated: false 
      });
    } catch (error) {
      localStorage.removeItem('accessToken');
      set({ 
        user: null, 
        isAuthenticated: false 
      });
      throw error;
    }
  },

  clearAuth: () => {
    set({ 
      user: null, 
      isAuthenticated: false 
    });
  }
}));