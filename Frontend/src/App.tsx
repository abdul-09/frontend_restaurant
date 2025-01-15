import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ResetPassword from './components/auth/ResetPassword';
import ResetPasswordConfirm from './components/auth/ResetPasswordConfirm';
import MenuManagement from './pages/MenuManagement';
import DeliveryDashboard from './pages/DeliveryDashboard';
import UserManagement from './pages/UserManagement';
import Cart from './pages/Cart';
import TableBooking from './pages/TableBooking';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirm />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            {/* Redirect root to appropriate dashboard based on role */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Common Routes */}
            <Route path="menu" element={<Menu />} />
            <Route path="cart" element={<Cart />} />
            
            {/* Customer Routes */}
            <Route path="orders" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="checkout" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="book-table" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <TableBooking />
              </ProtectedRoute>
            } />

            {/* Manager Routes */}
            <Route path="dashboard" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Dashboard />
              </ProtectedRoute>
            }>
              <Route path="menu-management" element={<MenuManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="orders" element={<Orders />} />
            </Route>

            {/* Delivery Crew Routes */}
            <Route path="deliveries" element={
              <ProtectedRoute allowedRoles={['delivery']}>
                <DeliveryDashboard />
              </ProtectedRoute>
            } />

            {/* Customer Dashboard */}
            <Route path="customer-dashboard" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/menu" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;