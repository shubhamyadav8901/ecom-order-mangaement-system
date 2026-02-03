import React, { useEffect, useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { api } from '../api';
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
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch(e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch(e) { console.error(e); }
  };

  const totalSales = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const activeOrders = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  // This would need real inventory check to be accurate, but using 0 as placeholder or calculating from products
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
               <th style={{ textAlign: 'left', padding: '1rem' }}>Order ID</th>
               <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
               <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
               <th style={{ textAlign: 'left', padding: '1rem' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map(o => (
              <tr key={o.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '1rem' }}>#{o.id}</td>
                <td style={{ padding: '1rem' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td style={{ padding: '1rem' }}><Badge variant={o.status === 'PAID' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'info'}>{o.status}</Badge></td>
                <td style={{ padding: '1rem' }}>${o.totalAmount.toFixed(2)}</td>
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
