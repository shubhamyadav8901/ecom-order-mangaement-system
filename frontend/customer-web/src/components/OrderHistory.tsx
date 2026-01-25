import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../api';

interface Order {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchWithAuth('/api/orders/my-orders')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch orders');
      })
      .then(data => setOrders(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 className="section-title">My Orders</h2>
      {orders.length === 0 ? (
         <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
           No orders found.
         </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8'
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td>${o.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
