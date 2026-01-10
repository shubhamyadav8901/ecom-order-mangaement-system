import React, { useState } from 'react';
import { ProductCatalog } from './components/ProductCatalog';
import { Cart } from './components/Cart';
import { OrderHistory } from './components/OrderHistory';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cart, setCart] = useState<any[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.accessToken);
        setToken(data.accessToken);
      } else {
        alert('Login Failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    const items = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      price: item.product.price
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        alert('Order Placed!');
        setCart([]);
        window.location.reload(); // Refresh to show order history
      } else {
        alert('Order Failed');
      }
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Customer Web App</h1>
      {!token ? (
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h2>Welcome!</h2>
            <button onClick={() => {
              localStorage.removeItem('token');
              setToken(null);
            }}>Logout</button>
          </div>

          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ flex: 2 }}>
              <h3>Catalog</h3>
              <ProductCatalog addToCart={addToCart} />
            </div>
            <div style={{ flex: 1 }}>
              <Cart items={cart} onCheckout={handleCheckout} clearCart={() => setCart([])} />
              <OrderHistory />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
