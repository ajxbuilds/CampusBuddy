import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cb_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const storedToken = localStorage.getItem('cb_token');
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
      const storedToken = localStorage.getItem('cb_token');
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
      localStorage.setItem('cb_token', resp.access_token);
      setToken(resp.access_token);
      setUser(resp.user);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      STUDENT: { email: 'student@campusbuddy.edu', pass: 'Student@123' },
      TEACHER: { email: 'teacher@campusbuddy.edu', pass: 'Teacher@123' },
      PARENT: { email: 'parent@campusbuddy.edu', pass: 'Parent@123' },
      ADMIN: { email: 'admin@campusbuddy.edu', pass: 'Admin@123' },
    };
    const c = creds[role];
    if (c) {
      await login(c.email, c.pass, role);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const resp = await api.register(data);
      localStorage.setItem('cb_token', resp.access_token);
      setToken(resp.access_token);
      setUser(resp.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('cb_token');
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
        quickLogin,
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
