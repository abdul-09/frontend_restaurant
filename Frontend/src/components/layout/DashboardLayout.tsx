import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Navigation from './Navigation';

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to appropriate dashboard based on role
  React.useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'manager':
          navigate('/dashboard');
          break;
        case 'delivery':
          navigate('/deliveries');
          break;
        case 'customer':
          navigate('/menu');
          break;
        default:
          navigate('/menu');
      }
    }
  }, [user?.role]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}