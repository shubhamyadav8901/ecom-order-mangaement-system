import { useState } from 'react';
import { ApiClient } from '../api/apiClient';

export function useAuth(tokenKey: string) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKey));
  const client = new ApiClient(tokenKey);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await client.post('/api/auth/login', { email, password });
    if (!res.ok) {
       const data = await res.json();
       throw new Error(data.message || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem(tokenKey, data.accessToken);
    setToken(data.accessToken);
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setToken(null);
  };

  return { token, login, logout, client };
}
