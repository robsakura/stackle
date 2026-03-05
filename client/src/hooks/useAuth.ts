'use client';

import { createContext, useContext } from 'react';

export interface AuthUser {
  userId: string;
  username: string;
  nickname: string;
}

export interface AuthContextValue {
  isLoggedIn: boolean;
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, nickname: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
