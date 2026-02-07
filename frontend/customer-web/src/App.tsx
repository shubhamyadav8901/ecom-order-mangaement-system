import React, { useState, useEffect } from 'react';
import { StoreLayout } from './layouts/StoreLayout';
import { HomePage } from './pages/HomePage';
import { CartPage } from './pages/CartPage';
import { OrderPage } from './pages/OrderPage';
import { api } from './api';
import { useToast } from '@shared/ui/Toast';
import { setAccessToken } from '@shared/api/client';
import { Input } from '@shared/ui/Input';
import { Button } from '@shared/ui/Button';
import { Spinner } from '@shared/ui/Spinner';

interface CartItem {
  product: any;
  quantity: number;
}

function App() {
  const { addToast } = useToast();
  // Token state only in memory
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [view, setView] = useState('catalog');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh-token');
        if (data.accessToken) {
           setAccessToken(data.accessToken);
           setToken(data.accessToken);
        }
      } catch (e) {
        // Not authenticated
        setAccessToken(null);
        setToken(null);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const addToCart = (product: any, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) return;
    setCartItems(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCartItems([]);

  const handleCheckout = async () => {
    try {
      const items = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      await api.post('/orders', { items });

      addToast('Order placed successfully!', 'success');
      setCartItems([]);
      setView('orders');
    } catch (err) {
      console.error(err);
      addToast('Checkout failed. Please check stock.', 'error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken } = response.data;
      // Do not store in localStorage
      setAccessToken(accessToken);
      setToken(accessToken);
      addToast('Welcome back!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Login failed. Check credentials.', 'error');
    }
  };

  const handleLogout = () => {
    api.post('/auth/logout').catch(err => {
      console.error(err);
    }).finally(() => {
      setAccessToken(null);
      setToken(null);
      setView('catalog');
      addToast('Logged out successfully', 'info');
    });
  };

  if (loadingAuth) {
      return (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Spinner />
          </div>
      );
  }

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f3f4f6' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Welcome Back</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input type="email" placeholder="Email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required />
            <Button type="submit" style={{ width: '100%' }}>Sign In</Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
             Use user@example.com / password
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
      {view === 'cart' && <CartPage items={cartItems} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} onClear={clearCart} onCheckout={handleCheckout} />}
      {view === 'orders' && <OrderPage onRetry={async (items) => {
          try {
             const ids = items.map(i => i.productId);
             const invRes = await api.post('/inventory/batch', ids);
             const stockMap = invRes.data;

             const prodRes = await api.get('/products');
             const allProducts = prodRes.data;

             let addedCount = 0;
             items.forEach(item => {
                 const product = allProducts.find((p: any) => p.id === item.productId);
                 if (product) {
                     const stock = stockMap[product.id] || 0;
                     if (stock > 0) {
                         const qtyToAdd = Math.min(item.quantity, stock);
                         addToCart({ ...product, stock }, qtyToAdd);
                         addedCount++;
                     }
                 }
             });

             if (addedCount > 0) {
                 setView('cart');
                 addToast(`${addedCount} items added to cart`, 'success');
             } else {
                 addToast('Items are out of stock', 'error');
             }
          } catch(e) {
              console.error(e);
              addToast('Failed to retry order', 'error');
          }
      }} />}
    </StoreLayout>
  );
}

export default App;
