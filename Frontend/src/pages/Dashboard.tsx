import React from 'react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Clock 
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, trend }: { 
  icon: any; 
  label: string; 
  value: string; 
  trend: string 
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-2">{value}</p>
      </div>
      <div className="bg-indigo-50 p-3 rounded-lg">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
    </div>
    <p className="text-sm text-gray-600 mt-4">
      <span className="text-green-600 font-medium">{trend}</span> vs last month
    </p>
  </div>
);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value="$23,456"
          trend="+12.5%"
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value="1,234"
          trend="+8.2%"
        />
        <StatCard
          icon={ShoppingBag}
          label="Total Orders"
          value="456"
          trend="+15.3%"
        />
        <StatCard
          icon={Clock}
          label="Avg. Delivery Time"
          value="25 min"
          trend="-5.1%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          {/* Order list will be implemented later */}
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Items</h3>
          {/* Popular items will be implemented later */}
        </div>
      </div>
    </div>
  );
}