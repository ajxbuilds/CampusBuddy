import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;

  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('cb_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = sessionStorage.getItem('cb_token');
      if (storedToken) {
        setToken(storedToken);
        const me = await api.getMe();
        setUser(me);
      }
    } catch {
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem('cb_token');
      if (storedToken) {
        try {
          const me = await api.getMe();
          setUser(me);
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      const resp = await api.login(email, password, role);
      sessionStorage.setItem('cb_token', resp.access_token);
      setToken(resp.access_token);
      setUser(resp.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const resp = await api.register(data);
      sessionStorage.setItem('cb_token', resp.access_token);
      setToken(resp.access_token);
      setUser(resp.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('cb_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
