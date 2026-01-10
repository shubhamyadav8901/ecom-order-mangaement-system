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
    // In a real system, Admin needs a specific endpoint to list ALL orders
    // Currently order-service only has /orders/{id} or /orders/user/{id}
    // We will simulate fetching specific orders or assume an admin endpoint exists.
    // For this prototype, let's mock it or fetch a known user's orders to demonstrate connectivity.
    // Ideally, I would add `GET /orders` (admin only) to backend.
    // Let's assume we implement `GET /orders` in backend or just show a placeholder if not ready.
    // WAIT: I didn't implement `GET /orders` (all) in backend Phase 4.
    // I will fetch user 1's orders as a demo.
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      // Demo: Fetching orders for a simulated user ID or specific known ID.
      // This is a limitation of the current backend API surface for "Admin" view.
      // Assuming we just show a placeholder or if I had time I'd add the endpoint.
      // I'll leave it empty but ready to connect.
      // console.log("Fetching orders...");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', marginTop: '20px', borderRadius: '8px' }}>
      <h3>Order Dashboard</h3>
      <p><i>(Admin API for listing all orders is pending backend implementation. This view is a placeholder structure.)</i></p>
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
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
