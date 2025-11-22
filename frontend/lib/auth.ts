"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

type User = { id: string; name: string; role: 'admin'|'resident'|'guard'|'staff'; email: string };

type Ctx = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (t) {
      setToken(t);
      api('/api/auth/me').then(r => setUser(r.user)).catch(() => {});
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return React.createElement(
    AuthContext.Provider,
    { value: { user, token, login, logout } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
