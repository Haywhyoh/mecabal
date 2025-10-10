import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userProfileService } from '../services/userProfileService';
import { useAuth } from './AuthContext';

// ==================== Types ====================

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  occupation?: string;
  professionalSkills?: string;
  culturalBackground?: string;
  nativeLanguages?: string;
  preferredLanguage?: string;
  state?: string;
  city?: string;
  estate?: string;
  landmark?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  isVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  addressVerified: boolean;
  trustScore: number;
  verificationLevel?: string;
  verificationBadge?: string;
  profileCompleteness: number;
  locationString: string;
  joinDate: string;
  lastActive?: string;
  isOnline?: boolean;
}

export interface TrustScore {
  score: number;
  breakdown: {
    phoneVerification: number;
    identityVerification: number;
    addressVerification: number;
    endorsements: number;
    activityLevel: number;
  };
  level: string;
  nextLevel: string;
  pointsToNextLevel: number;
  lastUpdated: string;
}

export interface DashboardStats {
  bookmarks: {
    count: number;
    items: any[];
  };
  savedDeals: {
    count: number;
  };
  events: {
    attending: number;
    organized: number;
    joined: number;
  };
  posts: {
    shared: number;
  };
  community: {
    neighborsHelped: number;
    trustScore: number;
  };
  lastUpdated: Date;
}

export interface ProfileCompletionResponse {
  completionPercentage: number;
  missingFields: string[];
  nextSteps: string[];
  isComplete: boolean;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  occupation?: string;
  professionalSkills?: string;
  culturalBackground?: string;
  nativeLanguages?: string;
  preferredLanguage?: string;
  state?: string;
  city?: string;
  estate?: string;
  landmark?: string;
  address?: string;
}

interface ProfileContextType {
  // Profile data
  profile: UserProfile | null;
  trustScore: TrustScore | null;
  dashboardStats: DashboardStats | null;
  profileCompletion: ProfileCompletionResponse | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  refreshProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  refreshTrustScore: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshProfileCompletion: () => Promise<void>;
  
  // Utility functions
  clearError: () => void;
  resetProfile: () => void;
}

// ==================== Helper Functions ====================

const getTrustLevel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Very Poor';
};

const getNextTrustLevel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

const getPointsToNextLevel = (score: number): number => {
  if (score >= 90) return 0;
  if (score >= 80) return 90 - score;
  if (score >= 70) return 80 - score;
  if (score >= 60) return 70 - score;
  if (score >= 40) return 60 - score;
  return 40 - score;
};

// ==================== Context ====================

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== Methods ====================

  const refreshProfile = async () => {
    if (!isAuthenticated) {
      console.log('Profile refresh skipped - user not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Refreshing user profile...');
      
      const data = await userProfileService.getCurrentUserProfile();
      setProfile(data);
      console.log('✅ Profile refreshed successfully');
    } catch (err: any) {
      console.error('❌ Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const refreshTrustScore = async () => {
    if (!isAuthenticated) {
      console.log('Trust score refresh skipped - user not authenticated');
      return;
    }

    try {
      console.log('🔄 Refreshing trust score...');
      
      // Get trust score from dashboard stats instead of separate endpoint
      const dashboardData = await userProfileService.getDashboardStats();
      
      if (dashboardData && dashboardData.community) {
        // Create a TrustScore object from dashboard data
        const trustScoreData: TrustScore = {
          score: dashboardData.community.trustScore,
          level: getTrustLevel(dashboardData.community.trustScore),
          nextLevel: getNextTrustLevel(dashboardData.community.trustScore),
          pointsToNextLevel: getPointsToNextLevel(dashboardData.community.trustScore),
          breakdown: {
            phoneVerification: 0, // These would need to come from a separate endpoint
            identityVerification: 0,
            addressVerification: 0,
            endorsements: 0,
            activityLevel: 0,
          },
          lastUpdated: dashboardData.lastUpdated,
        };
        
        setTrustScore(trustScoreData);
        console.log('✅ Trust score refreshed successfully from dashboard stats');
      }
    } catch (err: any) {
      console.error('❌ Error loading trust score:', err);
      // Don't set error for trust score as it's not critical
    }
  };

  const refreshDashboard = async () => {
    if (!isAuthenticated) {
      console.log('Dashboard refresh skipped - user not authenticated');
      return;
    }

    try {
      console.log('🔄 Refreshing dashboard stats...');
      const data = await userProfileService.getDashboardStats();
      setDashboardStats(data);
      
      // Also update trust score from dashboard data
      if (data && data.community) {
        const trustScoreData: TrustScore = {
          score: data.community.trustScore,
          level: getTrustLevel(data.community.trustScore),
          nextLevel: getNextTrustLevel(data.community.trustScore),
          pointsToNextLevel: getPointsToNextLevel(data.community.trustScore),
          breakdown: {
            phoneVerification: 0, // These would need to come from a separate endpoint
            identityVerification: 0,
            addressVerification: 0,
            endorsements: 0,
            activityLevel: 0,
          },
          lastUpdated: data.lastUpdated,
        };
        setTrustScore(trustScoreData);
      }
      
      console.log('✅ Dashboard stats refreshed successfully');
    } catch (err: any) {
      console.error('❌ Error loading dashboard stats:', err);
      // Don't set error for dashboard as it's not critical
    }
  };

  const refreshProfileCompletion = async () => {
    if (!isAuthenticated) {
      console.log('Profile completion refresh skipped - user not authenticated');
      return;
    }

    try {
      console.log('🔄 Refreshing profile completion...');
      const data = await userProfileService.getProfileCompletion();
      setProfileCompletion(data);
      console.log('✅ Profile completion refreshed successfully');
    } catch (err: any) {
      console.error('❌ Error loading profile completion:', err);
      // Don't set error for profile completion as it's not critical
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to update profile');
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Updating user profile...', data);
      
      const updated = await userProfileService.updateProfile(data);
      setProfile(updated);
      console.log('✅ Profile updated successfully');
      
      // Refresh related data
      await Promise.all([
        refreshProfileCompletion(),
        refreshTrustScore(),
      ]);
    } catch (err: any) {
      console.error('❌ Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to upload avatar');
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Uploading avatar...');
      
      const result = await userProfileService.uploadAvatar(imageUri);
      console.log('✅ Avatar uploaded successfully');

      // Update profile with new avatar URL
      if (profile) {
        setProfile({
          ...profile,
          profilePictureUrl: result.avatarUrl,
        });
      }
    } catch (err: any) {
      console.error('❌ Error uploading avatar:', err);
      setError(err.message || 'Failed to upload avatar');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const resetProfile = () => {
    setProfile(null);
    setTrustScore(null);
    setDashboardStats(null);
    setProfileCompletion(null);
    setError(null);
    setLoading(false);
  };

  // ==================== Effects ====================

  // Load profile data when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 User authenticated, loading profile data...');
      
      // Convert NigerianUser to UserProfile format
      const userProfile: UserProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || '',
        phoneNumber: user.phoneNumber,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
        occupation: user.occupation,
        professionalSkills: user.professionalSkills,
        culturalBackground: user.culturalBackground,
        nativeLanguages: user.nativeLanguages,
        preferredLanguage: user.preferredLanguage,
        state: user.state,
        city: user.city,
        estate: user.estate,
        landmark: user.landmark,
        address: user.address,
        isVerified: user.isVerified,
        phoneVerified: user.phoneVerified,
        identityVerified: user.identityVerified,
        addressVerified: user.addressVerified,
        trustScore: 0, // Will be loaded separately
        verificationLevel: user.verificationLevel?.toString(),
        profileCompleteness: 0, // Will be calculated
        locationString: [user.state, user.city, user.estate].filter(Boolean).join(', '),
        joinDate: user.createdAt,
        lastActive: user.updatedAt,
      };
      
      setProfile(userProfile);
      
      // Load additional data in parallel
      Promise.all([
        refreshProfile(),
        refreshTrustScore(),
        refreshDashboard(),
        refreshProfileCompletion(),
      ]);
    } else if (!isAuthenticated) {
      console.log('🔄 User not authenticated, clearing profile data...');
      resetProfile();
    }
  }, [isAuthenticated, user?.id]);

  // ==================== Context Value ====================

  const contextValue: ProfileContextType = {
    // Profile data
    profile,
    trustScore,
    dashboardStats,
    profileCompletion,
    
    // Loading states
    loading,
    error,
    
    // Actions
    refreshProfile,
    updateProfile,
    uploadAvatar,
    refreshTrustScore,
    refreshDashboard,
    refreshProfileCompletion,
    
    // Utility functions
    clearError,
    resetProfile,
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

// ==================== Hook ====================

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};

// ==================== Export ====================

export default ProfileContext;
