import React, { useState, useEffect } from 'react';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductPage } from './pages/ProductPage';
import { OrderPage } from './pages/OrderPage';
import { Input } from '@shared/ui/Input';
import { Button } from '@shared/ui/Button';
import { useToast } from '@shared/ui/Toast';
import { api } from './api';
import { setAccessToken } from '@shared/api/client';
import { Spinner } from '@shared/ui/Spinner';

function App() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [token, setToken] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.post('/auth/refresh-token');
        if (data.accessToken) {
           setAccessToken(data.accessToken);
           setToken(data.accessToken);
        }
      } catch (e) {
        setAccessToken(null);
        setToken(null);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken } = response.data;
      // Do not store in localStorage
      setAccessToken(accessToken);
      setToken(accessToken);
      addToast('Welcome Admin', 'success');
    } catch (error: any) {
      console.error(error);
      addToast('Login Failed: ' + (error.response?.data?.message || 'Check credentials'), 'error');
    }
  };

  const handleLogout = () => {
    // Ideally call logout endpoint
    setAccessToken(null);
    setToken(null);
    addToast('Logged out', 'info');
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
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Admin Login</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" style={{ width: '100%' }}>Sign In</Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
             Use admin@example.com / password
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout}>
      {currentView === 'dashboard' && <DashboardPage onNavigate={setCurrentView} />}
      {currentView === 'products' && <ProductPage />}
      {currentView === 'orders' && <OrderPage />}
    </AdminLayout>
  );
}

export default App;
