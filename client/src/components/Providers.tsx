'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AuthContext, type AuthUser } from '@/hooks/useAuth';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3001';

export default function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('stackle_token');
    const storedUser = localStorage.getItem('stackle_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${SERVER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    const tok: string = data.token;
    const parts = tok.split('.');
    const payload = JSON.parse(atob(parts[1]));
    const userData: AuthUser = {
      userId: payload.userId,
      username: payload.username,
      nickname: payload.nickname,
    };
    localStorage.setItem('stackle_token', tok);
    localStorage.setItem('stackle_user', JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  }, []);

  const register = useCallback(
    async (username: string, nickname: string, password: string) => {
      const res = await fetch(`${SERVER_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, nickname, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      await login(username, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('stackle_token');
    localStorage.removeItem('stackle_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!user, user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
