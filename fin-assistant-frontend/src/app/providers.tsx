import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import { AppApiError } from '../api/errors';
import type { User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  errorMessage: string | null;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const currentUser = await authApi.me();
      setUser(currentUser);
      setStatus('authenticated');
    } catch (err: unknown) {
      if (err instanceof AppApiError && err.status === 401) {
        setUser(null);
        setStatus('unauthenticated');
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'Сервер временно недоступен');
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    refreshSession();
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, errorMessage, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
