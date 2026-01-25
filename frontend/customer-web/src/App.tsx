import React, { useState } from 'react';
import { fetchWithAuth } from './api';
import { ProductCatalog } from './components/ProductCatalog';
import { Cart } from './components/Cart';
import { OrderHistory } from './components/OrderHistory';

interface CartItem {
  product: any;
  quantity: number;
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState('catalog'); // catalog, cart, orders
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

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

  // Simple auth placeholder
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-content">
          <a href="#" className="brand" onClick={() => setView('catalog')}>StoreFront</a>
          <div className="nav-links">
            <span
              className={`nav-link ${view === 'catalog' ? 'active' : ''}`}
              onClick={() => setView('catalog')}
            >
              Shop
            </span>
            {token && (
              <>
                <span
                  className={`nav-link ${view === 'cart' ? 'active' : ''}`}
                  onClick={() => setView('cart')}
                >
                  Cart <span className="cart-count">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
                </span>
                <span
                  className={`nav-link ${view === 'orders' ? 'active' : ''}`}
                  onClick={() => setView('orders')}
                >
                  Orders
                </span>
                <span className="nav-link" onClick={handleLogout}>Logout</span>
              </>
            )}
            {!token && (
              <span className="nav-link" onClick={() => alert('Please login below')}>Login</span>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container" style={{ flex: 1, paddingBottom: '3rem' }}>
        {!token ? (
          <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Welcome Back</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
              />
              <input
                style={{ padding: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              />
              <button className="btn" type="submit">Sign In</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
              Use <code style={{background: '#f1f5f9', padding: '2px 4px'}}>test@example.com</code> / <code style={{background: '#f1f5f9', padding: '2px 4px'}}>password</code>
            </p>
          </div>
        ) : (
          <>
            {view === 'catalog' && (
              <>
                <div style={{ textAlign: 'center', padding: '3rem 0', background: '#e0e7ff', borderRadius: '1rem', marginTop: '2rem', marginBottom: '2rem' }}>
                   <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e1b4b', marginBottom: '1rem' }}>Summer Collection 2026</h1>
                   <p style={{ fontSize: '1.25rem', color: '#4338ca' }}>Discover the best deals on premium items.</p>
                </div>
                <ProductCatalog onAddToCart={addToCart} />
              </>
            )}
            {view === 'cart' && <Cart items={cartItems} onRemove={removeFromCart} onClear={clearCart} onCheckout={handleCheckout} />}
            {view === 'orders' && <OrderHistory />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: '#1e293b', color: 'white', padding: '2rem 0', marginTop: 'auto' }}>
        <div className="container" style={{ textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
          &copy; 2026 StoreFront Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default App;
