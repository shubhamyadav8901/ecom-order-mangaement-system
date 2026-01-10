import React, { useEffect, useState } from 'react';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const fetchApi = async (url: string) => {
  const headers = getHeaders();
  const response = await fetch(url, { headers });
  return response;
};

export const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // Ideally extract userId from token or use /orders/me endpoint if it existed.
    // For now, we fetch manually assuming we know ID or use a placeholder endpoint.
    // Backend implemented /orders/user/{id}.
    // But we don't have ID easily unless we parse token.
    // Let's assume user ID 1 for demo or parsing if possible.
    // Actually, I refactored backend to extract ID from token in `OrderController`.
    // But `GET /orders/user/{id}` still requires ID in path.
    // I should have made `GET /orders/me` in Phase 4.
    // I will try to fetch `/orders/user/1` as a demo assumption or skip if hard.
    // Better: Implementation of `GET /orders/user/1` requires knowing ID is 1.
    // I'll skip fetching history for now or just mock it to show UI structure.

    // Actually, let's try to parse the JWT to get ID.
    const token = localStorage.getItem('token');
    if(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            if(payload.userId) {
                fetchApi(`/api/orders/user/${payload.userId}`)
                    .then(res => res.json())
                    .then(data => setOrders(data));
            }
        } catch(e) { console.error(e); }
    }
  }, []);

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>My Orders</h3>
      {orders.length === 0 ? <p>No orders found.</p> : (
        <ul>
          {orders.map(o => (
            <li key={o.id}>Order #{o.id} - {o.status} - ${o.totalAmount}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
