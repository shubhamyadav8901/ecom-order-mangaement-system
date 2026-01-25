import React, { useEffect, useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { fetchWithAuth } from '../api';

interface Order {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchWithAuth('/api/orders/my-orders')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>My Orders</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map(o => (
          <Card key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Order #{o.id}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}
              </div>
            </div>
            <div>
              <span style={{ fontWeight: 700, marginRight: '1rem' }}>${o.totalAmount.toFixed(2)}</span>
              <Badge variant={o.status === 'PAID' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'info'}>
                {o.status}
              </Badge>
            </div>
          </Card>
        ))}
        {orders.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center' }}>No orders found.</p>}
      </div>
    </div>
  );
};
