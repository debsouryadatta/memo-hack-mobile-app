import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  image: string;
  class: string;
  createdAt: number;
  updatedAt: number;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone: string, className: string, image?: string) => Promise<void>;
  signout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const signinMutation = useMutation(api.user.signin);
  const signupMutation = useMutation(api.user.signup);
  const getCurrentUserQuery = useQuery(api.user.getCurrentUser, token ? { token } : "skip");

  useEffect(() => {
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (getCurrentUserQuery) {
      setUser(getCurrentUserQuery);
      setIsLoading(false);
    } else if (token && getCurrentUserQuery === null) {
      // Token is invalid, clear it
      signout();
    } else if (!token) {
      setIsLoading(false);
    }
  }, [getCurrentUserQuery, token]);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      setIsLoading(false);
    }
  };

  const signin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const result = await signinMutation({ email, password });
      setToken(result.token);
      setUser(result.user);
      await AsyncStorage.setItem('auth_token', result.token);
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, phone: string, className: string, image?: string) => {
    try {
      setIsLoading(true);
      const result = await signupMutation({ email, password, name, phone, class: className, image });
      setToken(result.token);
      setUser(result.user);
      await AsyncStorage.setItem('auth_token', result.token);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signout = async () => {
    try {
      setToken(null);
      setUser(null);
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  const getCurrentUser = async () => {
    if (!token) return;
    // The query will automatically refetch when token changes
  };

  const isAuthenticated = user !== null;

  const value: AppContextType = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    token,
    signin,
    signup,
    signout,
    getCurrentUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
