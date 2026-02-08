import React, { useState, useEffect } from 'react';
import { Card } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { Modal } from '@shared/ui/Modal';
import { useToast } from '@shared/ui/Toast';
import { api } from '../api';

export const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch(e) { console.error(e); }
  };

  const handleCancel = async () => {
      if (!selectedOrder) return;
      if (!confirm('Are you sure you want to cancel this order?')) return;

      try {
          await api.post(`/orders/${selectedOrder.id}/cancel`);
          addToast('Order cancelled', 'success');
          fetchOrders();
          setSelectedOrder(null);
      } catch (_e) {
          addToast('Failed to cancel order', 'error');
      }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Orders</h2>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
               <th style={{ textAlign: 'left', padding: '1rem' }}>Order ID</th>
               <th style={{ textAlign: 'left', padding: '1rem' }}>Customer</th>
               <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
               <th style={{ textAlign: 'left', padding: '1rem' }}>Total</th>
               <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr
                key={o.id}
                style={{ borderTop: '1px solid #e5e7eb', transition: 'background-color 0.2s' }}
                className="hover:bg-gray-50"
              >
                <td style={{ padding: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(o)}
                    style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }}
                    aria-label={`Open details for order ${o.id}`}
                  >
                    #{o.id}
                  </button>
                </td>
                <td style={{ padding: '1rem' }}>User {o.userId}</td>
                <td style={{ padding: '1rem' }}><Badge variant={o.status === 'PAID' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'info'}>{o.status}</Badge></td>
                <td style={{ padding: '1rem' }}>${o.totalAmount.toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
             {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>}
          </tbody>
        </table>
      </Card>

      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id}`}
        footer={
             (selectedOrder?.status === 'PAID' || selectedOrder?.status === 'PLACED' || selectedOrder?.status === 'CREATED') ? (
                 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Close</Button>
                    <Button variant="danger" onClick={handleCancel}>Cancel Order</Button>
                 </div>
             ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Close</Button>
                </div>
             )
        }
      >
          {selectedOrder && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#4b5563' }}>
                      <span>Date: {new Date(selectedOrder.createdAt).toLocaleString()}</span>
                      <span>User ID: {selectedOrder.userId}</span>
                  </div>
                  <div>
                      <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Status: </span>
                      <Badge variant={selectedOrder.status === 'PAID' ? 'success' : selectedOrder.status === 'CANCELLED' ? 'danger' : 'info'}>
                        {selectedOrder.status}
                      </Badge>
                  </div>
                  <div style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
                      <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Items</h4>
                      {selectedOrder.items && selectedOrder.items.map((item: any, idx: number) => (
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
