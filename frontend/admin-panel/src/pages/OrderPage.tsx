import React, { useState, useEffect } from 'react';
import { Card } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { fetchWithAuth } from '../api';

export const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetchWithAuth('/api/orders');
      if (res.ok) setOrders(await res.json());
    } catch(e) { console.error(e); }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Orders</h2>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
               <th>Order ID</th>
               <th>Customer</th>
               <th>Status</th>
               <th>Total</th>
               <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>User {o.userId}</td>
                <td><Badge variant={o.status === 'PAID' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'info'}>{o.status}</Badge></td>
                <td>${o.totalAmount.toFixed(2)}</td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
             {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
