'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginInput, RegisterInput, ChangePasswordInput } from '@/types';
import { authApi } from '@/lib/api/auth';
import { setAccessToken, getAccessToken } from '@/lib/api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  changePassword: (data: ChangePasswordInput) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    // Safety fallback: ensure loading never hangs for more than 1.5 seconds
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    try {
      const token = getAccessToken();
      if (token) {
        setAccessToken(token);
        const me = await authApi.getMe();
        setUser(me);
      } else {
        // Attempt silent refresh on startup using HttpOnly cookie
        const res = await authApi.refresh();
        if (res && res.user) {
          setUser(res.user);
        }
      }
    } catch {
      setUser(null);
      setAccessToken(null);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };


  useEffect(() => {
    initAuth();
  }, []);

  const login = async (data: LoginInput) => {
    const res = await authApi.login(data);
    setUser(res.user);
  };

  const register = async (data: RegisterInput) => {
    const res = await authApi.register(data);
    setUser(res.user);
  };

  const googleLogin = async (credential: string) => {
    const res = await authApi.googleLogin(credential);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await authApi.logoutAll();
    } finally {
      setUser(null);
    }
  };

  const changePassword = async (data: ChangePasswordInput) => {
    await authApi.changePassword(data);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        logoutAll,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
