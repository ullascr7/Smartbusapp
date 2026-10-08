import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDepotManager: boolean;
  isDriver: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: 'user' | 'admin' | 'depot_manager_mysuru' | 'depot_manager_bengaluru' | 'driver') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.auth.getMe()
        .then(res => {
          setUser(res.user);
        })
        .catch(() => {
          removeAuthToken();
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const res = await api.auth.register({ name, email, password, phone });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  const quickDemoLogin = async (role: 'user' | 'admin' | 'depot_manager_mysuru' | 'depot_manager_bengaluru' | 'driver') => {
    switch (role) {
      case 'admin':
        await login('admin@smartbus.ai', 'admin123');
        break;
      case 'depot_manager_mysuru':
        await login('manager.mysuru@smartbus.ai', 'manager123');
        break;
      case 'depot_manager_bengaluru':
        await login('manager.bengaluru@smartbus.ai', 'manager123');
        break;
      case 'driver':
        await login('driver@smartbus.ai', 'driver123');
        break;
      default:
        await login('user@smartbus.ai', 'password123');
        break;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'ADMIN',
        isDepotManager: user?.role === 'depot_manager' || user?.role === 'DEPOT_MANAGER',
        isDriver: user?.role === 'driver' || user?.role === 'DRIVER',
        login,
        register,
        logout,
        quickDemoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
