import React, { useState, useEffect } from 'react';
import { Card } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
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
  userId: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface UserSummary {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | string>('ALL');
  const [customerFilter, setCustomerFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [userById, setUserById] = useState<Record<number, UserSummary>>({});
  const { addToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const fetchedOrders: Order[] = Array.isArray(res.data) ? res.data : [];
      setOrders(fetchedOrders);

      const uniqueUserIds = Array.from(new Set(fetchedOrders.map((order) => order.userId).filter((id) => typeof id === 'number')));
      if (uniqueUserIds.length === 0) {
        setUserById({});
        return;
      }

      const nextMap: Record<number, UserSummary> = {};
      try {
        const usersRes = await api.post('/users/batch', uniqueUserIds);
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        users.forEach((user: UserSummary) => {
          if (typeof user.id === 'number') {
            nextMap[user.id] = user;
          }
        });
      } catch {
        // Keep fallback placeholders when user details lookup fails.
      }
      setUserById(nextMap);
    } catch(e) { console.error(e); }
  };

  const getUserDisplayName = (userId: number) => {
    const user = userById[userId];
    if (!user) return `User ${userId}`;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    if (fullName) return fullName;
    if (user.email) return user.email;
    return `User ${userId}`;
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

  const statuses = Array.from(new Set(orders.map((order) => order.status))).sort();
  const visibleOrders = orders.filter((order) => {
    if (statusFilter !== 'ALL' && order.status !== statusFilter) {
      return false;
    }

    const customerQuery = customerFilter.trim().toLowerCase();
    if (customerQuery) {
      const user = userById[order.userId];
      const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase();
      const email = (user?.email || '').toLowerCase();
      const userId = String(order.userId);
      const haystack = `${fullName} ${email} ${userId}`.trim();
      if (!haystack.includes(customerQuery)) {
        return false;
      }
    }

    if (fromDate || toDate) {
      const createdDate = new Date(order.createdAt);
      if (Number.isNaN(createdDate.getTime())) {
        return false;
      }
      if (fromDate) {
        const fromBoundary = new Date(`${fromDate}T00:00:00`);
        if (createdDate < fromBoundary) {
          return false;
        }
      }
      if (toDate) {
        const toBoundary = new Date(`${toDate}T23:59:59`);
        if (createdDate > toBoundary) {
          return false;
        }
      }
    }

    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Orders</h2>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            Customer
            <input
              type="text"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder="Name, email or user id"
              style={{ height: 34, width: 210, border: '1px solid #d1d5db', borderRadius: 8, padding: '0 0.6rem', background: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ height: 34, border: '1px solid #d1d5db', borderRadius: 8, padding: '0 0.45rem', background: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ height: 34, border: '1px solid #d1d5db', borderRadius: 8, padding: '0 0.45rem', background: '#fff' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ height: 34, border: '1px solid #d1d5db', borderRadius: 8, padding: '0 0.6rem', background: '#fff' }}
            >
              <option value="ALL">All ({orders.length})</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status} ({orders.filter((order) => order.status === status).length})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
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
            {visibleOrders.map(o => (
              <tr
                key={o.id}
                style={{ borderTop: '1px solid #e5e7eb', transition: 'background-color 0.2s', cursor: 'pointer' }}
                className="hover:bg-gray-50"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedOrder(o)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedOrder(o);
                  }
                }}
              >
                <td style={{ padding: '1rem' }}>
                  #{o.id}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{getUserDisplayName(o.userId)}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{userById[o.userId]?.email || `user id: ${o.userId}`}</div>
                </td>
                <td style={{ padding: '1rem' }}><Badge variant={o.status === 'PAID' ? 'success' : o.status === 'CANCELLED' ? 'danger' : 'info'}>{o.status}</Badge></td>
                <td style={{ padding: '1rem' }}>${o.totalAmount.toFixed(2)}</td>
                <td style={{ padding: '1rem' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
             {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No orders found.</td></tr>}
             {orders.length > 0 && visibleOrders.length === 0 && (
               <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No orders match status: {statusFilter}</td></tr>
             )}
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
