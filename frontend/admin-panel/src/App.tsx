import React, { useState } from 'react';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductPage } from './pages/ProductPage';
import { OrderPage } from './pages/OrderPage';
import { Input } from '@shared/ui/Input';
import { Button } from '@shared/ui/Button';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
  const [currentView, setCurrentView] = useState('dashboard');

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
        localStorage.setItem('adminToken', data.accessToken);
        setToken(data.accessToken);
      } else {
        alert('Login Failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
      alert('Login Error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2 className="login-title">Admin Login</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" style={{ width: '100%' }}>Sign In</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout}>
      {currentView === 'dashboard' && <DashboardPage />}
      {currentView === 'products' && <ProductPage />}
      {currentView === 'orders' && <OrderPage />}
    </AdminLayout>
  );
}

export default App;
