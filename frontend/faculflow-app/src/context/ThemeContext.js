import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext({
  isDark: false,
  colors: {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  // Load persistently saved theme preference on start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('userTheme');
        if (storedTheme !== null) {
          setIsDark(storedTheme === 'dark');
        } else {
          setIsDark(systemScheme === 'dark');
        }
      } catch (error) {
        console.warn('Failed to load theme preference from AsyncStorage:', error);
      }
    };
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    try {
      const nextTheme = !isDark;
      setIsDark(nextTheme);
      await AsyncStorage.setItem('userTheme', nextTheme ? 'dark' : 'light');
    } catch (error) {
      console.warn('Failed to save theme preference to AsyncStorage:', error);
    }
  };

  // Premium Linear App design system tokens
  const colors = {
    background: isDark ? '#08090a' : '#f4f5f6',
    card: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
    cardBorder: isDark ? '#111214' : '#e4e5e6',
    text: isDark ? '#f7f8f8' : '#111111',
    textSecondary: isDark ? '#a1a8b5' : '#555555',
    primary: isDark ? '#00b4d8' : '#0077b6',
    accent: isDark ? '#ff9f1c' : '#ff7b00',
    streakFire: '#ff5400',
    green: '#2ec4b6',
    gold: '#ffb703',
    grey100: isDark ? '#161719' : '#f0f1f2',
    grey200: isDark ? '#222428' : '#e4e5e6',
    white: '#ffffff',
    black: '#000000',
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
