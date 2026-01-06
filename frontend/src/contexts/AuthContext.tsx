import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    console.log('[AuthContext] refreshUser start');
    if (!api.getToken()) {
      console.log('[AuthContext] No token present, treating as logged out');
      setUser(null);
      setIsLoading(false);
      return;
    }

    const result = await api.getCurrentUser();
    if (result.success && result.data) {
      console.log('[AuthContext] Current user loaded', { id: result.data.id, email: result.data.email });
      setUser(result.data);
    } else {
      console.warn('[AuthContext] Failed to load current user, clearing session', { error: result.error });
      setUser(null);
      api.setToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] login called', { email });
    const result = await api.login({ email, password });
    if (result.success && result.data) {
      console.log('[AuthContext] login success, updating user state', {
        id: result.data.user.id,
        email: result.data.user.email,
      });
      setUser(result.data.user);
      return { success: true };
    }
    console.warn('[AuthContext] login failed', { email, error: result.error });
    return { success: false, error: result.error };
  };

  const signup = async (email: string, password: string, name?: string) => {
    console.log('[AuthContext] signup called', { email });
    const result = await api.signup({ email, password, name });
    if (result.success && result.data) {
      console.log('[AuthContext] signup success, updating user state', {
        id: result.data.user.id,
        email: result.data.user.email,
      });
      setUser(result.data.user);
      return { success: true };
    }
    console.warn('[AuthContext] signup failed', { email, error: result.error });
    return { success: false, error: result.error };
  };

  const logout = () => {
    console.log('[AuthContext] logout called');
    api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
