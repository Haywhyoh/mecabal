// MeCabal Authentication Context
// Global authentication state management

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MeCabalAuth } from '../services/auth';
import { UserProfileService } from '../services/userProfile';
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
      // Try to get user from backend first
      const profileResult = await UserProfileService.getCurrentUserProfile();
      
      if (profileResult.success && profileResult.data) {
        // Convert backend response to NigerianUser format
        const backendUser: NigerianUser = {
          id: profileResult.data.id,
          firstName: profileResult.data.firstName,
          lastName: profileResult.data.lastName,
          fullName: profileResult.data.fullName,
          email: profileResult.data.email,
          phoneNumber: profileResult.data.phoneNumber,
          profilePictureUrl: profileResult.data.profilePictureUrl,
          dateOfBirth: profileResult.data.dateOfBirth,
          gender: profileResult.data.gender,
          isVerified: profileResult.data.isVerified,
          phoneVerified: profileResult.data.phoneVerified,
          identityVerified: profileResult.data.identityVerified,
          addressVerified: profileResult.data.addressVerified,
          trustScore: profileResult.data.trustScore,
          verificationLevel: profileResult.data.verificationLevel,
          verificationBadge: profileResult.data.verificationBadge,
          bio: profileResult.data.bio,
          occupation: profileResult.data.occupation,
          professionalSkills: profileResult.data.professionalSkills,
          culturalBackground: profileResult.data.culturalBackground,
          nativeLanguages: profileResult.data.nativeLanguages,
          preferredLanguage: profileResult.data.preferredLanguage,
          state: profileResult.data.state,
          city: profileResult.data.city,
          estate: profileResult.data.estate,
          locationString: profileResult.data.locationString,
          landmark: profileResult.data.landmark,
          address: profileResult.data.address,
          isActive: profileResult.data.isActive,
          memberSince: profileResult.data.memberSince,
          lastLoginAt: profileResult.data.lastLoginAt,
          createdAt: profileResult.data.createdAt,
          updatedAt: profileResult.data.updatedAt,
          joinDate: profileResult.data.joinDate,
          profileCompleteness: profileResult.data.profileCompleteness,
        };
        
        setUser(backendUser);
      } else {
        // Fallback to old method if backend fails
        const currentUser = await MeCabalAuth.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('User refresh error:', error);
      // Fallback to old method on error
      try {
        const currentUser = await MeCabalAuth.getCurrentUser();
        setUser(currentUser);
      } catch (fallbackError) {
        console.error('Fallback user refresh error:', fallbackError);
      }
    }
  };

  const updateProfile = async (updates: Partial<NigerianUser>): Promise<boolean> => {
    if (!user) return false;

    try {
      // Use the new UserProfileService instead of old method
      const result = await UserProfileService.updateCurrentUserProfile(updates as any);

      if (result.success && result.data) {
        // Convert backend response to NigerianUser format
        const updatedUser: NigerianUser = {
          ...user,
          ...updates,
          // Map backend response fields to user object
          firstName: result.data.firstName || user.firstName,
          lastName: result.data.lastName || user.lastName,
          profilePictureUrl: result.data.profilePictureUrl || user.profilePictureUrl,
          bio: result.data.bio || user.bio,
          occupation: result.data.occupation || user.occupation,
          professionalSkills: result.data.professionalSkills || user.professionalSkills,
          culturalBackground: result.data.culturalBackground || user.culturalBackground,
          nativeLanguages: result.data.nativeLanguages || user.nativeLanguages,
          preferredLanguage: result.data.preferredLanguage || user.preferredLanguage,
          state: result.data.state || user.state,
          city: result.data.city || user.city,
          estate: result.data.estate || user.estate,
          landmark: result.data.landmark || user.landmark,
          address: result.data.address || user.address,
          isVerified: result.data.isVerified || user.isVerified,
          phoneVerified: result.data.phoneVerified || user.phoneVerified,
          identityVerified: result.data.identityVerified || user.identityVerified,
          addressVerified: result.data.addressVerified || user.addressVerified,
          trustScore: result.data.trustScore || user.trustScore,
          verificationLevel: result.data.verificationLevel || user.verificationLevel,
          verificationBadge: result.data.verificationBadge || user.verificationBadge,
          profileCompleteness: result.data.profileCompleteness || user.profileCompleteness,
        };

        setUser(updatedUser);
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
