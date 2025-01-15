// import React from 'react';
import OrderList from '../components/order/OrderList';

export default function OrderHistory() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Order History</h1>
      <OrderList />
    </div>
  );
}