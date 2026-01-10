import React, { useState } from 'react';
import { ProductManager } from './components/ProductManager';
import { OrderDashboard } from './components/OrderDashboard';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

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
        alert('Login Failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>Admin Panel</h1>
      {!token ? (
        <div style={{ maxWidth: '300px', margin: 'auto', background: 'white', padding: '20px', borderRadius: '8px' }}>
          <h2>Admin Login</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '8px' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '8px' }}
            />
            <button type="submit" style={{ padding: '10px' }}>Login</button>
          </form>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Dashboard</h2>
            <button onClick={() => {
              localStorage.removeItem('adminToken');
              setToken(null);
            }}>Logout</button>
          </div>

          <ProductManager />
          <OrderDashboard />
        </div>
      )}
    </div>
  );
}

export default App;
