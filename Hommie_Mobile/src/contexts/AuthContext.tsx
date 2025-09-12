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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<NigerianUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize authentication state and listen for changes
  useEffect(() => {
    initializeAuth();
    
    // Listen to Supabase auth state changes
    const { data: authListener } = MeCabalAuth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile when signed in
          const userProfile = await MeCabalAuth.getCurrentUser();
          setUser(userProfile);
        } else if (event === 'SIGNED_OUT') {
          // Clear user when signed out
          setUser(null);
        }
      }
    );
    
    // Cleanup listener on unmount
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const currentUser = await MeCabalAuth.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, otpCode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Verify OTP
      const otpResult = await MeCabalAuth.verifyOTP(phoneNumber, otpCode, 'login');
      
      if (otpResult.success && otpResult.verified) {
        // Complete login
        const loginResult = await MeCabalAuth.completeLogin(phoneNumber);
        
        if (loginResult.success && loginResult.user) {
          setUser(loginResult.user);
          return true;
        }
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
      
      // Verify email OTP
      const otpResult = await MeCabalAuth.verifyEmailOTP(email, otpCode, 'login');
      
      if (otpResult.success && otpResult.verified) {
        // Complete email login
        const loginResult = await MeCabalAuth.completeEmailLogin(email);
        
        if (loginResult.success && loginResult.user) {
          setUser(loginResult.user);
          return true;
        }
      }
      
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
