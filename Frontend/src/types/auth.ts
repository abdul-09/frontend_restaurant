export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  groups: string[];
}

export type UserRole = 'customer' | 'manager' | 'delivery';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}