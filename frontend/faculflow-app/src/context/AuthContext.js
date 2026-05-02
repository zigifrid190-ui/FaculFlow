import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on app launch
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const userData = await SecureStore.getItemAsync('userData');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (err) {
      console.warn('Auth check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.login(email, password);
      await SecureStore.setItemAsync('accessToken', data.tokens.access);
      await SecureStore.setItemAsync('refreshToken', data.tokens.refresh);
      await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Erro ao fazer login. Tente novamente.';
      setError(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const { data } = await authAPI.register(userData);
      await SecureStore.setItemAsync('accessToken', data.tokens.access);
      await SecureStore.setItemAsync('refreshToken', data.tokens.refresh);
      await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const errors = err.response?.data;
      let message = 'Erro ao cadastrar. Tente novamente.';
      if (errors) {
        // Django DRF returns field-level errors
        const firstField = Object.keys(errors)[0];
        if (firstField && Array.isArray(errors[firstField])) {
          message = errors[firstField][0];
        } else if (typeof errors === 'string') {
          message = errors;
        }
      }
      setError(message);
      return { success: false, message };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userData');
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!user,
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
