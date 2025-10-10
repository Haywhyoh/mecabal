import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Image, RefreshControl, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { contextAwareGoBack } from '../utils/navigationUtils';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { UserProfile } from '../components/UserProfile';
import TrustScoreCard from '../components/TrustScoreCard';
import DashboardStatsCard from '../components/DashboardStatsCard';
import { UserDashboardService, DashboardStats } from '../services/userDashboard';
import { UserProfileService, ProfileCompletionResponse } from '../services/userProfile';
import { AvatarUploadService } from '../services/avatarUpload';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { SkeletonPlaceholder } from '../components/SkeletonPlaceholder';
import { ToastService } from '../services/toastService';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { logout, user, refreshUser } = useAuth();
  const { 
    trustScore, 
    dashboardStats: contextDashboardStats, 
    profileCompletion: contextProfileCompletion,
    loading: profileLoading,
    error: profileError,
    refreshProfile,
    refreshTrustScore,
    refreshDashboard,
    refreshProfileCompletion
  } = useProfile();

  // State for dashboard data (fallback to old service if ProfileContext not available)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionResponse | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoadingStats(true);
      setError(null);

      // Fetch dashboard stats
      const statsResponse = await UserDashboardService.getDashboardStats();
      if (statsResponse.success && statsResponse.data) {
        setDashboardStats(statsResponse.data);
      } else {
        setError(statsResponse.error || 'Failed to load dashboard stats');
      }

      // Fetch profile completion
      const completionResponse = await UserProfileService.getProfileCompletion();
      if (completionResponse.success && completionResponse.data) {
        setProfileCompletion(completionResponse.data);
      } else {
        setError(completionResponse.error || 'Failed to load profile completion');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Use ProfileContext refresh methods
    await Promise.all([
      refreshProfile(),
      refreshTrustScore(),
      refreshDashboard(),
      refreshProfileCompletion(),
      fetchDashboardData(), // Fallback to old service
      refreshUser()
    ]);
    
    setRefreshing(false);
  };

  const handleAvatarChange = async () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const imageUri = await AvatarUploadService.pickImageFromCamera();
              if (imageUri) {
                await uploadAvatar(imageUri);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to take photo');
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            try {
              const imageUri = await AvatarUploadService.pickImageFromLibrary();
              if (imageUri) {
                await uploadAvatar(imageUri);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to choose photo');
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      const result = await AvatarUploadService.uploadAvatar(imageUri);

      if (result.success && result.data) {
        // Update user context with new avatar URL
        await refreshUser();
        ToastService.showSuccess('Success', 'Profile photo updated successfully!');
      } else {
        ToastService.showError('Error', result.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      ToastService.showError('Error', 'An unexpected error occurred');
    }
  };


  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled automatically by AuthContext
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Show error state if there's an error
  if (error && !isLoadingStats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => contextAwareGoBack(navigation, 'main')}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <MaterialCommunityIcons name="cog" size={24} color="#2C2C2C" />
          </TouchableOpacity>
        </View>
        <ErrorState
          title="Failed to Load Profile"
          message={error}
          onRetry={fetchDashboardData}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => contextAwareGoBack(navigation, 'main')}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <MaterialCommunityIcons name="cog" size={24} color="#2C2C2C" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00A651"
          />
        }
      >
        {/* 1. IDENTITY - Who am I? */}
        <View style={styles.profileSection}>
          <UserProfile
            user={user}
            size="large"
            showLocation={true}
            showJoinDate={true}
            showVerificationBadge={true}
            showCameraButton={true}
            onCameraPress={handleAvatarChange}
            onAvatarUpdated={async (avatarUrl: string) => {
              // Update user context with new avatar URL
              await refreshUser();
            }}
          />

          <TouchableOpacity style={styles.locationContainer} onPress={() => navigation.navigate('EstateManager' as never)}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#8E8E8E" />
            <Text style={styles.userLocation}>
              {user?.city || 'Unknown'}, {user?.state || 'Unknown'}
            </Text>
            <Text style={styles.estateCount}>• {user?.estate ? '1 estate' : 'No estates'}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#8E8E8E" style={styles.chevron} />
          </TouchableOpacity>
        </View>

        {/* 2. ACHIEVEMENT - My standing */}
        <View style={styles.trustScoreSection}>
          <TrustScoreCard 
            trustScore={trustScore}
            loading={profileLoading}
            compact={true}
            showBreakdown={false}
            onPress={() => {
              // Navigate to dedicated Trust Score detail screen
              navigation.navigate('TrustScoreDetail' as never);
              // OR show modal with full details
              // Alert.alert('Trust Score', 'Full breakdown...');
            }}
          />
        </View>

        {/* 3. VERIFICATION - Build trust */}
        <View style={styles.verificationSection}>
          <Text style={styles.verificationTitle}>Identity Verification</Text>
          <Text style={styles.verificationSubtitle}>
            Verify your identity to build trust and unlock community features
          </Text>
          
          <View style={styles.verificationButtons}>
            <TouchableOpacity 
              style={styles.verificationButton}
              onPress={() => navigation.navigate('NINVerification' as never)}
            >
              <MaterialCommunityIcons name="card-account-details" size={20} color="#00A651" />
              <Text style={styles.verificationButtonText}>Verify NIN</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.verificationButton}
              onPress={() => navigation.navigate('DocumentUpload' as never)}
            >
              <MaterialCommunityIcons name="file-upload" size={20} color="#2196F3" />
              <Text style={styles.verificationButtonText}>Upload Documents</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. ACTIVITY SUMMARY - What I'm doing */}
        <View style={styles.dashboardStatsSection}>
          <DashboardStatsCard 
            dashboardStats={contextDashboardStats || dashboardStats}
            loading={profileLoading || isLoadingStats}
            compact={true}
            onViewAll={() => navigation.navigate('Dashboard' as never)}
            onStatPress={(statType, data) => {
              // Navigate to Dashboard with specific tab/filter
              navigation.navigate('Dashboard' as never, { focus: statType });
            }}
          />
        </View>

        {/* 5. IMPROVEMENT - Make profile better */}
        <View style={styles.section}>
          <Text style={styles.enhancementTitle}>Better profile, better MeCabal</Text>
          <Text style={styles.enhancementSubtitle}>It's true. Share your story and you'll get more replies from posts and listings.</Text>
          
          <TouchableOpacity style={styles.bioCard} onPress={() => navigation.navigate('CulturalProfile' as never)}>
            <MaterialCommunityIcons name="pencil" size={24} color="#FFC107" />
            <View style={styles.bioContent}>
              <Text style={styles.bioTitle}>Complete your profile</Text>
              <Text style={styles.bioSubtitle}>Add cultural background and personal details</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

        {/* 6. CONNECTIONS - Build network */}
        <TouchableOpacity style={styles.findNeighborsCard}>
          <View style={styles.findNeighborsContent}>
            <Text style={styles.findNeighborsTitle}>Find and connect with neighbors</Text>
            <Text style={styles.findNeighborsSubtitle}>Discover people in your estate and build connections</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E8E" />
        </TouchableOpacity>

        {/* 7. ACTIONS - Primary actions */}
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile' as never)}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#2C2C2C" />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* 8. BUSINESS - Optional feature */}
        <TouchableOpacity style={styles.businessCard} onPress={() => navigation.navigate('BusinessRegistration' as never)}>
          <MaterialCommunityIcons name="plus-circle" size={20} color="#00A651" />
          <Text style={styles.businessText}>Add business page</Text>
        </TouchableOpacity>

        {/* 9. SIGN OUT - Destructive action at bottom */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialCommunityIcons name="logout" size={20} color="#E74C3C" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  estateCount: {
    fontSize: 14,
    color: '#00A651',
    fontWeight: '500',
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  userLocation: {
    fontSize: 16,
    color: '#8E8E93',  // Apple's secondary text color
    marginLeft: 4,
  },
  findNeighborsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,  // 2 units (8pt grid)
    paddingVertical: 20,
    paddingHorizontal: 20,  // 2.5 units for card padding
    borderRadius: 16,  // Apple's preferred card radius
    flexDirection: 'row',
    alignItems: 'center',
    // Apple-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,  // Very subtle
    shadowRadius: 8,
    elevation: 2,
  },
  findNeighborsContent: {
    flex: 1,
  },
  findNeighborsTitle: {
    fontSize: 17,  // Apple's preferred body size
    fontWeight: '600',
    color: '#1C1C1E',  // Apple's dark color
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  findNeighborsSubtitle: {
    fontSize: 15,  // Apple's preferred body size
    color: '#8E8E93',  // Apple's secondary text color
    letterSpacing: -0.2,
  },
  editProfileButton: {
    backgroundColor: '#F5F5F5',  // Keep subtle
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,  // Slightly larger touch target
    borderRadius: 12,  // Apple's preferred button radius
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Add subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  editProfileText: {
    fontSize: 17,  // Apple's preferred body size
    fontWeight: '600',
    color: '#1C1C1E',  // Apple's dark color
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,  // 2 units (8pt grid)
    padding: 20,  // 2.5 units (preferred for card padding)
    borderRadius: 16,  // Increased from 12 for Apple aesthetic
    // Apple-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,  // Very subtle
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',  // Apple's dark color
    marginBottom: 16,
    letterSpacing: -0.4,  // Tight tracking for headers
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 13,
    color: '#8E8E93',  // Apple's secondary text color
    fontWeight: '400',
    marginLeft: 4,
  },
  dashboardGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dashboardCard: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  dashboardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginTop: 8,
    marginBottom: 4,
  },
  dashboardCount: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  enhancementTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',  // Apple's dark color
    marginBottom: 8,
    letterSpacing: -0.4,  // Tight tracking for headers
  },
  enhancementSubtitle: {
    fontSize: 15,  // Apple's preferred body size
    color: '#8E8E93',  // Apple's secondary text color
    lineHeight: 20,
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  bioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',  // Apple's secondary background
    padding: 16,
    borderRadius: 12,  // Apple's preferred button radius
  },
  bioContent: {
    flex: 1,
    marginLeft: 12,
  },
  bioTitle: {
    fontSize: 17,  // Apple's preferred body size
    fontWeight: '600',
    color: '#1C1C1E',  // Apple's dark color
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  bioSubtitle: {
    fontSize: 15,  // Apple's preferred body size
    color: '#8E8E93',  // Apple's secondary text color
    letterSpacing: -0.2,
  },
  businessCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,  // 2.5 units for card padding
    borderRadius: 16,  // Apple's preferred card radius
    flexDirection: 'row',
    alignItems: 'center',
    // Apple-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,  // Very subtle
    shadowRadius: 8,
    elevation: 2,
  },
  businessText: {
    fontSize: 17,  // Apple's preferred body size
    color: '#00A651',  // Keep brand color
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: -0.2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 17,  // Apple's preferred body size
    color: '#FF3B30',  // Apple's destructive color
    fontWeight: '500',
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  skeletonContainer: {
    marginTop: 16,
  },
  verificationSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,  // 2.5 units for card padding
    borderRadius: 16,  // Apple's preferred card radius
    // Apple-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,  // Very subtle
    shadowRadius: 8,
    elevation: 2,
  },
  verificationTitle: {
    fontSize: 20,  // Apple's preferred header size
    fontWeight: '700',  // Bold for headers
    color: '#1C1C1E',  // Apple's dark color
    marginBottom: 8,
    letterSpacing: -0.4,  // Tight tracking for headers
  },
  verificationSubtitle: {
    fontSize: 15,  // Apple's preferred body size
    color: '#8E8E93',  // Apple's secondary text color
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  verificationButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,  // Apple's preferred button radius
    borderWidth: 1.5,  // Slightly thicker border
    borderColor: '#E5E5EA',  // Apple's separator color
    // Active state with shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  verificationButtonText: {
    fontSize: 15,  // Apple's preferred body size
    fontWeight: '600',
    color: '#1C1C1E',  // Apple's dark color
    marginLeft: 8,
    letterSpacing: -0.2,
  },
  trustScoreSection: {
    marginHorizontal: 16,
    marginBottom: 24,  // 3 units - more space between major sections
  },
  dashboardStatsSection: {
    marginHorizontal: 16,
    marginBottom: 24,  // 3 units - more space between major sections
  },
});
