"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export type Role = 'admin' | 'resident' | 'guard' | 'staff';
export type User = { id: string; name: string; role: Role; email: string };

type Ctx = {
  user: User | null;
  token: string | null;
  bootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Ctx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!t) {
      setBootstrapping(false);
      return;
    }
    setToken(t);
    api('/api/auth/me')
      .then(r => setUser({ ...r.user, id: r.user.id ?? r.user._id }))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setBootstrapping(false));
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
    { value: { user, token, bootstrapping, login, logout } },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
