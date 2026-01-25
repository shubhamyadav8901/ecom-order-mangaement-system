import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';

interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export const OrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await fetchWithAuth('/api/orders');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card" style={{ marginTop: '20px' }}>
      <h3 style={{ marginBottom: '1rem' }}>Order Dashboard</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>User ID</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.userId}</td>
              <td>{o.status}</td>
              <td>${o.totalAmount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
