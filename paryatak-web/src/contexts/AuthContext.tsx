'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

type User = { id: string; name: string; email: string; role: string; avatarUrl?: string; };
type AuthCtx = { user: User | null; token: string | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string) => Promise<void>; logout: () => void; };

const AuthContext = createContext<AuthCtx>({ user: null, token: null, loading: true, login: async () => {}, register: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('paryatak_token');
    if (t) {
      setToken(t);
      axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => setUser(r.data.data))
        .catch(() => { localStorage.removeItem('paryatak_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (email: string, password: string) => {
    const r = await axios.post(`${API}/auth/login`, { email, password });
    const { accessToken, user: u } = r.data.data;
    localStorage.setItem('paryatak_token', accessToken);
    setToken(accessToken); setUser(u);
  };

  const register = async (name: string, email: string, password: string) => {
    const r = await axios.post(`${API}/auth/register`, { name, email, password });
    const { accessToken, user: u } = r.data.data;
    localStorage.setItem('paryatak_token', accessToken);
    setToken(accessToken); setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('paryatak_token');
    setToken(null); setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
