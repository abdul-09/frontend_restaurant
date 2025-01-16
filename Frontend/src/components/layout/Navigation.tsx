import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

const Navigation = () => {
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

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
              Five Star Cafe
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
                <Link to="/orders" className="text-gray-600 hover:text-gray-900">
                  Orders
                </Link>
                <Link to="/book-table" className="text-gray-600 hover:text-gray-900">
                  Book Table
                </Link>
                <Link 
                  to="/cart" 
                  className="relative text-gray-600 hover:text-gray-900"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {itemCount}
                    </span>
                  )}
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
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Cart</span>
                    {itemCount > 0 && (
                      <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Orders
                  </Link>
                  <Link
                    to="/book-table"
                    className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Book Table
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