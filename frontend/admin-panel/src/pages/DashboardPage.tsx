import React, { useEffect, useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { fetchWithAuth } from '../api';
import { DollarSign, ShoppingBag, AlertTriangle } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetchWithAuth('/api/orders');
      if (res.ok) setOrders(await res.json());
    } catch(e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetchWithAuth('/api/products');
      if (res.ok) setProducts(await res.json());
    } catch(e) { console.error(e); }
  };

  const totalSales = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const lowStock = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <StatCard title="Total Sales" value={`$${totalSales.toFixed(2)}`} icon={<DollarSign color="#16a34a" />} />
        <StatCard title="Active Orders" value={activeOrders} icon={<ShoppingBag color="#2563eb" />} />
        <StatCard title="Low Stock Alerts" value={lowStock} icon={<AlertTriangle color="#dc2626" />} />
      </div>

      <Card>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Recent Orders</h3>
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
            {orders.slice(0, 5).map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td><Badge variant={o.status === 'PAID' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'info'}>{o.status}</Badge></td>
                <td>${o.totalAmount.toFixed(2)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No orders yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

const StatCard = ({ title, value, icon }: any) => (
  <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ padding: '0.75rem', background: '#f3f4f6', borderRadius: '50%' }}>{icon}</div>
    <div>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{title}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</p>
    </div>
  </Card>
);
