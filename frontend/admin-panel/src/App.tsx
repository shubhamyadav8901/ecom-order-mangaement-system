import React, { useState, useEffect } from 'react';
import { ProductManager } from './components/ProductManager';
import { OrderDashboard } from './components/OrderDashboard';
import { Layout } from './components/Layout';

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
          <form onSubmit={handleLogin}>
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn" style={{ width: '100%' }} type="submit">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView} onLogout={handleLogout}>
      {currentView === 'dashboard' && (
        <div className="card">
          <h3>Welcome to the Admin Dashboard</h3>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
            Select an option from the sidebar to manage your store.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
             <div style={{ padding: '1rem', background: '#e0e7ff', borderRadius: '0.5rem' }}>
                <h4>Total Sales</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$12,345</p>
             </div>
             <div style={{ padding: '1rem', background: '#dcfce7', borderRadius: '0.5rem' }}>
                <h4>Active Orders</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>42</p>
             </div>
             <div style={{ padding: '1rem', background: '#fee2e2', borderRadius: '0.5rem' }}>
                <h4>Low Stock Items</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>5</p>
             </div>
          </div>
        </div>
      )}
      {currentView === 'products' && <ProductManager />}
      {currentView === 'orders' && <OrderDashboard />}
    </Layout>
  );
}

export default App;
