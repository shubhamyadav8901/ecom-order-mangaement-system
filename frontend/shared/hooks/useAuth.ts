import { useState } from 'react';
import { api, setAccessToken } from '../api/client';

export function useAuth(tokenKey: string) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKey));

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem(tokenKey, data.accessToken);
      setAccessToken(data.accessToken);
      setToken(data.accessToken);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setAccessToken(null);
    setToken(null);
  };

  return { token, login, logout, client: api };
}
