import React, { useEffect, useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button'; // Assuming Button exists
import { Modal } from '@shared/ui/Modal';
import { useToast } from '@shared/ui/Toast';
import { api } from '../api';

interface OrderItem {
    productId: number;
    quantity: number;
    price: number;
}

interface Order {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface OrderPageProps {
    onRetry?: (items: OrderItem[]) => void;
}

export const OrderPage: React.FC<OrderPageProps> = ({ onRetry }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');
  const { addToast } = useToast();

  const fetchOrders = () => {
    api.get('/orders/my-orders')
      .then((res: any) => setOrders(res.data))
      .catch((err: any) => console.error(err));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async () => {
      if (!selectedOrder) return;
      try {
          await api.post(`/orders/${selectedOrder.id}/cancel`);
          addToast('Order cancelled', 'success');
          fetchOrders();
          setSelectedOrder(null);
      } catch (_e) {
          addToast('Failed to cancel order', 'error');
      }
  };

  const statuses = Array.from(new Set(orders.map((order) => order.status))).sort();
  const visibleOrders = orders.filter((order) => statusFilter === 'ALL' || order.status === statusFilter);

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>My Orders</h2>
      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          style={{
            border: statusFilter === 'ALL' ? '1px solid #111827' : '1px solid #cbd5e1',
            background: statusFilter === 'ALL' ? '#111827' : '#fff',
            color: statusFilter === 'ALL' ? '#fff' : '#334155',
            borderRadius: 999,
            padding: '0.25rem 0.7rem',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          All ({orders.length})
        </button>
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            style={{
              border: statusFilter === status ? '1px solid #111827' : '1px solid #cbd5e1',
              background: statusFilter === status ? '#111827' : '#fff',
              color: statusFilter === status ? '#fff' : '#334155',
              borderRadius: 999,
              padding: '0.25rem 0.7rem',
              fontSize: '0.78rem',
              cursor: 'pointer'
            }}
          >
            {status} ({orders.filter((order) => order.status === status).length})
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {visibleOrders.map(o => (
          <div key={o.id} style={{ transition: 'transform 0.2s' }}>
            <Card
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOrder(o)}
              onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedOrder(o);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
            >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    Order #{o.id}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 700 }}>${o.totalAmount.toFixed(2)}</span>
                  <Badge variant={o.status === 'PAID' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'info'}>
                    {o.status}
                  </Badge>
                </div>
            </Card>
          </div>
        ))}
        {orders.length === 0 && <p style={{ color: '#6b7280', textAlign: 'center' }}>No orders found.</p>}
        {orders.length > 0 && visibleOrders.length === 0 && (
          <p style={{ color: '#6b7280', textAlign: 'center' }}>No orders match status: {statusFilter}</p>
        )}
      </div>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id}`}
        footer={
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                {(selectedOrder?.status === 'PAID' || selectedOrder?.status === 'PLACED' || selectedOrder?.status === 'CREATED') && (
                    <Button variant="danger" onClick={handleCancel}>Cancel Order</Button>
                )}
                {selectedOrder?.status === 'CANCELLED' && (
                    <Button onClick={() => onRetry && onRetry(selectedOrder.items)}>Retry Order</Button>
                )}
                <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
        }
      >
          {selectedOrder && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#4b5563' }}>
                      <span>Date: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                      <span>Status: <span style={{ fontWeight: 600 }}>{selectedOrder.status}</span></span>
                  </div>
                  <div style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
                      <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Items</h4>
                      {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                              <span>Product {item.productId} (x{item.quantity})</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                      ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700 }}>
                      <span>Total</span>
                      <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};
