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
      } catch (e) {
          addToast('Failed to cancel order', 'error');
      }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>My Orders</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map(o => (
          <div key={o.id} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }}>
            <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Order #{o.id}</div>
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
