import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, LogBox } from 'react-native';
import { authAPI, usersAPI } from '../services/api';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go'
]);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on app launch
  useEffect(() => {
    checkAuth();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;
    
    // Evita chamadas de permissão e registros no Expo Go (não suportado desde SDK 53)
    const isExpoGo = 
      Constants.appOwnership === 'expo' || 
      Constants.executionEnvironment === 'store-client';
      
    if (isExpoGo) {
      console.log('Skipping push notification registration in Expo Go.');
      return null;
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return null;
      }
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: 'faculflow-id' // Ideally from app.json
        })).data;
      } catch (error) {
        console.warn('Erro ao pegar push token:', error);
      }
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00897B',
      });
    }

    return token;
  };

  const syncPushToken = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await usersAPI.updateProfile({ push_token: token });
      }
    } catch (e) {
      console.warn('Erro ao sincronizar push token', e);
    }
  };

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const userData = await SecureStore.getItemAsync('userData');
      if (token && userData) {
        setUser(JSON.parse(userData));
        syncPushToken(); // Sync token if user is already logged in
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
      syncPushToken(); // Sync token after login
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
      syncPushToken(); // Sync token after register
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
