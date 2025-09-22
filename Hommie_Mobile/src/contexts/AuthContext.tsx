// MeCabal Authentication Context
// Global authentication state management

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MeCabalAuth } from '../services/auth';
import type { NigerianUser } from '../types/supabase';

interface AuthContextType {
  user: NigerianUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneNumber: string, otpCode: string) => Promise<boolean>;
  loginWithEmail: (email: string, otpCode: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<NigerianUser>) => Promise<boolean>;
  setUser: (user: NigerianUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<NigerianUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔄 Initializing authentication...');

      // Check if tokens exist first
      const hasToken = await MeCabalAuth.getAuthToken();
      console.log('🔄 Token check:', hasToken ? 'Token exists' : 'No token');

      if (!hasToken) {
        console.log('🔄 No stored token - user not authenticated');
        setIsLoading(false);
        return;
      }

      const currentUser = await MeCabalAuth.getCurrentUser();
      console.log('🔄 Auth initialization result:', currentUser ? `User found: ${currentUser.firstName} ${currentUser.lastName}` : 'No user');

      // Only set user if we actually got one - don't clear existing user state
      if (currentUser) {
        setUser(currentUser);
      } else {
        console.log('🔄 No user found during initialization - keeping existing state');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Don't clear user state on initialization errors
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, otpCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Complete login with OTP verification
      const loginResult = await MeCabalAuth.completeLogin(phoneNumber, otpCode);
      
      if (loginResult.success && loginResult.user) {
        setUser(loginResult.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, otpCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Complete email login with OTP verification
      const loginResult = await MeCabalAuth.completeEmailLogin(email, otpCode);

      if (loginResult.success && loginResult.user) {
        console.log('✅ Email login successful, setting user:', loginResult.user.firstName, loginResult.user.lastName);
        setUser(loginResult.user);
        return true;
      }

      console.log('❌ Email login failed:', loginResult.error);
      return false;
    } catch (error) {
      console.error('Email login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // If userData is already a complete user object (from edge function), just set it
      if (userData.id && userData.email) {
        setUser(userData);
        return true;
      }
      
      // Otherwise, create user account using the old method
      const result = await MeCabalAuth.createUser(userData);
      
      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await MeCabalAuth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await MeCabalAuth.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('User refresh error:', error);
    }
  };

  const updateProfile = async (updates: Partial<NigerianUser>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const result = await MeCabalAuth.updateProfile(user.id, updates);
      
      if (result.success && result.data) {
        setUser(result.data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  // Method to directly set user (for immediate auth state updates)
  const setUserDirectly = (userData: NigerianUser | null) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    loginWithEmail,
    register,
    logout,
    refreshUser,
    updateProfile,
    setUser: setUserDirectly,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
