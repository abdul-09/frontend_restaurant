import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Menu, X } from 'lucide-react';

const Navigation = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              The Bear
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/menu" className="text-gray-600 hover:text-gray-900">
              Menu
            </Link>

            {user?.role === 'manager' && (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/dashboard/menu-management" className="text-gray-600 hover:text-gray-900">
                  Menu Management
                </Link>
                <Link to="/dashboard/users" className="text-gray-600 hover:text-gray-900">
                  Users
                </Link>
              </>
            )}

            {user?.role === 'delivery' && (
              <Link to="/deliveries" className="text-gray-600 hover:text-gray-900">
                Deliveries
              </Link>
            )}

            {user?.role === 'customer' && (
              <>
                <Link to="/cart" className="text-gray-600 hover:text-gray-900">
                  Cart
                </Link>
                <Link to="/orders" className="text-gray-600 hover:text-gray-900">
                  Orders
                </Link>
              </>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{user.lastName}</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/menu"
                className="block px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                Menu
              </Link>

              {user?.role === 'manager' && (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/dashboard/menu-management"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Menu Management
                  </Link>
                  <Link
                    to="/dashboard/users"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Users
                  </Link>
                </>
              )}

              {user?.role === 'delivery' && (
                <Link
                  to="/deliveries"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                >
                  Deliveries
                </Link>
              )}

              {user?.role === 'customer' && (
                <>
                  <Link
                    to="/cart"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cart
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Orders
                  </Link>
                </>
              )}

              {user ? (
                <div className="space-y-2">
                  <span className="block px-3 py-2 text-gray-600">
                    {user.lastName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;