import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  CalendarDays, 
  Users,
  Truck,
  Settings,
  ClipboardList
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NavItem = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${
        isActive ? 'bg-indigo-50 text-indigo-600' : ''
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{children}</span>
  </NavLink>
);

export default function Sidebar() {
  const { user } = useAuthStore();

  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800">Restaurant</h2>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <NavItem to="/dashboard" icon={LayoutDashboard}>Dashboard</NavItem>
          <NavItem to="/menu" icon={UtensilsCrossed}>Menu</NavItem>
          <NavItem to="/orders" icon={ClipboardList}>Orders</NavItem>
          <NavItem to="/reservations" icon={CalendarDays}>Reservations</NavItem>
          
          {user?.role === 'manager' && (
            <>
              <NavItem to="/users" icon={Users}>Users</NavItem>
              <NavItem to="/delivery" icon={Truck}>Delivery</NavItem>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <NavItem to="/settings" icon={Settings}>Settings</NavItem>
        </div>
      </div>
    </aside>
  );
}