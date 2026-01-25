import React, { useState } from 'react';
import { StoreLayout } from './layouts/StoreLayout';
import { HomePage } from './pages/HomePage';
import { CartPage } from './pages/CartPage';
import { OrderPage } from './pages/OrderPage';
import { fetchWithAuth } from './api';
import { Input } from '@shared/ui/Input';
import { Button } from '@shared/ui/Button';

interface CartItem {
  product: any;
  quantity: number;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState('catalog');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const addToCart = (product: any) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => setCartItems([]);

  const handleCheckout = async () => {
    try {
      const items = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      const res = await fetchWithAuth('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items })
      });

      if (res.ok) {
        alert('Order placed successfully!');
        setCartItems([]);
        setView('orders');
      } else {
        alert('Checkout failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error during checkout');
    }
  };

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
        alert('Login failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('catalog');
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Welcome Back</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
            <Button type="submit" style={{ width: '100%' }}>Sign In</Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
             Use test@example.com / password
          </p>
        </div>
      </div>
    );
  }

  return (
    <StoreLayout
      currentView={view}
      onNavigate={setView}
      cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
      isLoggedIn={!!token}
      onLogout={handleLogout}
    >
      {view === 'catalog' && <HomePage onAddToCart={addToCart} />}
      {view === 'cart' && <CartPage items={cartItems} onRemove={removeFromCart} onClear={clearCart} onCheckout={handleCheckout} />}
      {view === 'orders' && <OrderPage />}
    </StoreLayout>
  );
}

export default App;
