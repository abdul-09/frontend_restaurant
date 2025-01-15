import axiosInstance from '../utils/axios';
import { RegisterData,  User } from '../types/auth';
import { toast } from 'react-hot-toast';
import { AxiosError } from 'axios';

interface ErrorResponse {
  [key: string]: string[];
}

export const authService = {
  login: async (email: string, password: string) => {
    try {
      
      // First get the tokens
      const tokenResponse = await axiosInstance.post('/api/v1/auth/jwt/create/', {
        email,
        password,
      });

      // Only store access token in localStorage, refresh token comes as httpOnly cookie
      const accessToken = tokenResponse.data.access;
      localStorage.setItem('accessToken', accessToken);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Now get the user data with the token set
      const userResponse = await axiosInstance.get('/api/v1/auth/users/me/');
      
      return {
        tokens: { access: accessToken }, // We don't need to return refresh token as it's in cookie
        user: {
          id: userResponse.data.id,
          email: userResponse.data.email,
          firstName: userResponse.data.first_name,
          lastName: userResponse.data.last_name,
          role: userResponse.data.role
        }
      };
    } catch (error) {
      // Clean up if anything fails
      localStorage.removeItem('accessToken');
      delete axiosInstance.defaults.headers.common['Authorization'];
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post('/api/v1/auth/jwt/logout/');
      // Clear the Authorization header
      delete axiosInstance.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the header even if request fails
      delete axiosInstance.defaults.headers.common['Authorization'];
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      const response = await axiosInstance.post('/api/v1/auth/users/', {
        email: data.email,
        password: data.password,
        re_password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
      });
      toast.success('Registration successful!');
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 400) {
        const errorData = error.response.data as ErrorResponse;
        Object.keys(errorData).forEach(key => {
          if (Array.isArray(errorData[key])) {
            toast.error(`${key}: ${errorData[key][0]}`);
          }
        });
      } else {
        toast.error('Registration failed. Please try again.');
      }
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get('/api/v1/auth/users/me/');
    return {
      id: response.data.id,
      email: response.data.email,
      firstName: response.data.first_name,
      lastName: response.data.last_name,
      role: response.data.role
    };
  },

  requestPasswordReset: async (email: string) => {
    try {
      await axiosInstance.post('/api/v1/auth/users/reset_password/', { email });
      return true;
    } catch (error) {
        console.error('Password reset request error:', error);
        throw error;
    }
  },

  resetPasswordConfirm: async (uid: string, token: string, new_password: string) => {
    try {
        await axiosInstance.post('/api/v1/auth/users/reset_password_confirm/', {
            uid,
            token,
            new_password,
            re_new_password: new_password,
        });
        return true;
    } catch (error) {
        console.error('Password reset confirm error:', error);
        throw error;
    }
  },
}; 