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
  product: { id: number; price: number; stock?: number; imageUrls?: string[]; [key: string]: any };
  quantity: number;
}

const isActiveProduct = (product: { status?: string } | null | undefined): boolean =>
  ((product?.status ?? 'ACTIVE').toUpperCase() === 'ACTIVE');

const getApiErrorMessage = (err: any, fallback: string): string => {
  const message = err?.response?.data?.message || err?.response?.data?.error || err?.message;
  if (!message || typeof message !== 'string') {
    return fallback;
  }
  return message;
};

const extractNotFoundProductId = (message: string): number | null => {
  const match = message.match(/product not found with id[:\s]+(\d+)/i);
  if (!match?.[1]) {
    return null;
  }
  const id = Number(match[1]);
  return Number.isNaN(id) ? null : id;
};

const verifyProductStillExists = async (productId: number): Promise<boolean> => {
  try {
    await api.get(`/products/${productId}`);
    return true;
  } catch (err: any) {
    return err?.response?.status !== 404;
  }
};

function App() {
  const { addToast } = useToast();
  // Token state only in memory
  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [view, setView] = useState('catalog');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh-token');
        if (data.accessToken) {
           setAccessToken(data.accessToken);
           setToken(data.accessToken);
        }
      } catch (_e) {
        // Not authenticated
        setAccessToken(null);
        setToken(null);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const addToCart = (product: CartItem['product'], quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      const maxAllowed = typeof product.stock === 'number' ? product.stock : Number.POSITIVE_INFINITY;

      if (maxAllowed <= 0) {
        return prev;
      }

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, maxAllowed);
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, product: { ...item.product, ...product }, quantity: nextQuantity }
            : item
        );
      }

      const initialQuantity = Math.min(quantity, maxAllowed);
      return [...prev, { product, quantity: initialQuantity }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) return;
    setCartItems(prev => prev.map(item => {
      if (item.product.id !== productId) {
        return item;
      }
      const maxAllowed = typeof item.product.stock === 'number' ? item.product.stock : Number.POSITIVE_INFINITY;
      const clampedQuantity = maxAllowed <= 0 ? item.quantity : Math.min(quantity, maxAllowed);
      return { ...item, quantity: clampedQuantity };
    }));
  };

  const clearCart = () => setCartItems([]);

  const handleCheckout = async () => {
    if (isCheckingOut || cartItems.length === 0) return;
    setIsCheckingOut(true);
    try {
      const catalogResponse = await api.get('/products');
      const catalogProducts: Array<{ id: number; status?: string }> = Array.isArray(catalogResponse.data)
        ? catalogResponse.data
        : [];
      const validIds = new Set(
        catalogProducts
          .filter((p) => p && typeof p.id === 'number' && (p.status || 'ACTIVE').toUpperCase() === 'ACTIVE')
          .map((p) => p.id)
      );

      const invalidItemIds = cartItems
        .filter((item) => !validIds.has(item.product.id))
        .map((item) => item.product.id);

      if (invalidItemIds.length > 0) {
        setCartItems((prev) => prev.filter((item) => !invalidItemIds.includes(item.product.id)));
        addToast(`Removed unavailable product(s): ${invalidItemIds.join(', ')}`, 'error');
        return;
      }

      const items = cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price
      }));

      await api.post('/orders', { items });

      addToast('Order placed successfully!', 'success');
      setCartItems([]);
      setView('orders');
    } catch (err: any) {
      console.error(err);
      const message = getApiErrorMessage(err, 'Checkout failed. Please try again.');
      const staleProductId = extractNotFoundProductId(message);
      if (staleProductId !== null) {
        const stillExists = await verifyProductStillExists(staleProductId);
        if (!stillExists) {
          setCartItems((prev) => prev.filter((item) => item.product.id !== staleProductId));
          addToast(`Removed unavailable product ${staleProductId} from cart.`, 'error');
        } else {
          addToast('Checkout failed due to temporary catalog mismatch. Please retry.', 'error');
        }
        return;
      }
      const status = err?.response?.status;
      if (status === 409) {
        addToast(message, 'error');
      } else {
        addToast(message, 'error');
      }
    } finally {
      setIsCheckingOut(false);
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
        </div>
      </div>
    );
  }

  return (
    <StoreLayout
      currentView={view}
      onNavigate={setView}
      selectedCategoryId={selectedCategoryId}
      onSelectCategory={setSelectedCategoryId}
      cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
      isLoggedIn={!!token}
      onLogout={handleLogout}
    >
      {view === 'catalog' && (
        <HomePage
          onAddToCart={addToCart}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          cartQuantities={cartItems.reduce((acc, item) => {
            acc[item.product.id] = item.quantity;
            return acc;
          }, {} as Record<number, number>)}
        />
      )}
      {view === 'cart' && (
        <CartPage
          items={cartItems}
          onRemove={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onClear={clearCart}
          onCheckout={handleCheckout}
          isCheckingOut={isCheckingOut}
        />
      )}
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
                 if (product && isActiveProduct(product)) {
                     const stock = stockMap[product.id] || 0;
                     if (stock > 0) {
                         const existingQty = cartItems.find(ci => ci.product.id === product.id)?.quantity || 0;
                         const remaining = Math.max(0, stock - existingQty);
                         const qtyToAdd = Math.min(item.quantity, remaining);
                         if (qtyToAdd > 0) {
                           addToCart({ ...product, stock }, qtyToAdd);
                           addedCount++;
                         }
                     }
                 }
             });

             if (addedCount > 0) {
                 setView('cart');
                 addToast(`${addedCount} items added to cart`, 'success');
             } else {
                 addToast('Items are out of stock', 'error');
             }
          } catch (e) {
              console.error(e);
              addToast('Failed to retry order', 'error');
          }
      }} />}
    </StoreLayout>
  );
}

export default App;
