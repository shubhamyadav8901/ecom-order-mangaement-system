import React, { useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In real app, check for ADMIN role
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('adminToken', data.accessToken);
        setToken(data.accessToken);
        alert('Admin Login Successful');
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
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Admin Email"
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
          <h2>Dashboard</h2>
          <p>Inventory & Product Management (Placeholder)</p>
          <button onClick={() => {
            localStorage.removeItem('adminToken');
            setToken(null);
          }}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;
