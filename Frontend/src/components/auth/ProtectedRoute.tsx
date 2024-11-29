import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles = [] }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch(user.role.toLowerCase()) {
      case 'managers':
        return <Navigate to="/manager/dashboard" replace />;
      case 'crew':
        return <Navigate to="/delivery/dashboard" replace />;
      default:
        return <Navigate to="/customer/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;