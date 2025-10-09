import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BUSINESS_VERIFICATION_LEVELS, formatNairaCurrency, calculateAverageRating } from '../constants/businessData';
import { ScreenHeader } from '../components/ScreenHeader';
import { businessApi } from '../services/api';
import { BusinessProfile } from '../services/types/business.types';

interface BusinessProfileScreenProps {
  navigation?: any;
}

export default function BusinessProfileScreen({ navigation }: BusinessProfileScreenProps) {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Load business profile on mount
  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const business = await businessApi.getMyBusiness();
      setBusinessProfile(business);
    } catch (err: any) {
      setError(err.message || 'Failed to load business profile');
      console.error('Error loading business profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBusinessProfile();
    setRefreshing(false);
  }, []);

  const getVerificationInfo = () => {
    if (!businessProfile) return null;
    return BUSINESS_VERIFICATION_LEVELS.find(level => level.id === businessProfile.isVerified ? 'basic' : 'basic');
  };

  const handleEditProfile = () => {
    if (businessProfile) {
      navigation?.navigate('EditBusinessProfile', { business: businessProfile });
    }
  };

  const handleManageServices = () => {
    Alert.alert('Manage Services', 'Navigate to services management screen');
  };

  const handleViewReviews = () => {
    Alert.alert('View Reviews', 'Navigate to reviews and ratings screen');
  };

  const handleBusinessSettings = () => {
    Alert.alert('Business Settings', 'Navigate to business settings screen');
  };

  const handleToggleAvailability = async () => {
    if (!businessProfile || updatingStatus) return;

    Alert.alert(
      businessProfile.isActive ? 'Go Offline?' : 'Go Online?',
      businessProfile.isActive
        ? 'Your business will be hidden from neighbor searches'
        : 'Your business will be visible to neighbors in your service area',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: businessProfile.isActive ? 'Go Offline' : 'Go Online',
          onPress: async () => {
            try {
              setUpdatingStatus(true);
              const updated = await businessApi.updateBusinessStatus(
                businessProfile.id,
                !businessProfile.isActive
              );
              setBusinessProfile(updated);
              Alert.alert(
                'Success',
                `Your business is now ${updated.isActive ? 'online' : 'offline'}`
              );
            } catch (err: any) {
              Alert.alert('Error', 'Failed to update status. Please try again.');
              console.error('Error updating status:', err);
            } finally {
              setUpdatingStatus(false);
            }
          }
        }
      ]
    );
  };

  const verificationInfo = getVerificationInfo();

  // Loading state
  if (loading && !businessProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Profile" navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00A651" />
          <Text style={styles.loadingText}>Loading business profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No business profile state
  if (!businessProfile && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Profile" navigation={navigation} />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="store-off" size={64} color="#8E8E8E" />
          <Text style={styles.emptyTitle}>No Business Profile</Text>
          <Text style={styles.emptyMessage}>
            You haven't registered a business yet. Create your business profile to start
            connecting with neighbors.
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation?.navigate('BusinessRegistration')}
          >
            <Text style={styles.createButtonText}>Create Business Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Error state (still show UI with error message)
  if (error && !businessProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Business Profile" navigation={navigation} />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadBusinessProfile}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader 
        title="Business Profile"
        navigation={navigation}
        rightComponent={
          <TouchableOpacity onPress={handleEditProfile}>
            <MaterialCommunityIcons name="pencil" size={24} color="#00A651" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Cover & Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.coverImage}>
            <View style={styles.coverPlaceholder}>
              <MaterialCommunityIcons name="image" size={32} color="#8E8E8E" />
              <Text style={styles.coverText}>Add Cover Photo</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.profileImageContainer}>
              {businessProfile.profileImage ? (
                <Image source={{ uri: businessProfile.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <MaterialCommunityIcons name="store" size={32} color="#8E8E8E" />
                </View>
              )}
              <TouchableOpacity style={styles.editImageButton}>
                <MaterialCommunityIcons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.businessInfo}>
              <View style={styles.businessHeader}>
                <Text style={styles.businessName}>{businessProfile.businessName}</Text>
                {verificationInfo && (
                  <View style={styles.verificationBadge}>
                    <MaterialCommunityIcons name={verificationInfo.badge as any} size={16} color={verificationInfo.color} />
                    <Text style={[styles.verificationText, { color: verificationInfo.color }]}>
                      {verificationInfo.name.replace(' Verification', '')}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.subcategory}>{businessProfile.subcategory}</Text>
              <Text style={styles.experience}>{businessProfile.yearsOfExperience} years experience</Text>
              
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                <Text style={styles.rating}>{businessProfile.rating}</Text>
                <Text style={styles.reviewCount}>({businessProfile.reviewCount} reviews)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Toggle */}
        <View style={styles.statusSection}>
          <View style={styles.statusInfo}>
            <View style={[styles.statusIndicator, businessProfile.isActive && styles.statusActive]} />
            <Text style={styles.statusText}>
              {businessProfile.isActive ? 'Available for bookings' : 'Currently offline'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.statusToggle, businessProfile.isActive && styles.statusToggleActive]}
            onPress={handleToggleAvailability}
          >
            <Text style={[styles.statusToggleText, businessProfile.isActive && styles.statusToggleTextActive]}>
              {businessProfile.isActive ? 'Go Offline' : 'Go Online'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#00A651" />
            <Text style={styles.statNumber}>{businessProfile.completedJobs}</Text>
            <Text style={styles.statLabel}>Jobs Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#0066CC" />
            <Text style={styles.statNumber}>{businessProfile.responseTime}</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="repeat" size={20} color="#FF6B35" />
            <Text style={styles.statNumber}>89%</Text>
            <Text style={styles.statLabel}>Repeat Customers</Text>
          </View>
        </View>

        {/* Business Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.cardTitle}>About This Business</Text>
          <Text style={styles.description}>{businessProfile.description}</Text>
          
          <View style={styles.businessDetails}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#8E8E8E" />
              <Text style={styles.detailText}>Service Area: {businessProfile.serviceArea}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="currency-ngn" size={16} color="#8E8E8E" />
              <Text style={styles.detailText}>Pricing: {businessProfile.pricingModel}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="clock" size={16} color="#8E8E8E" />
              <Text style={styles.detailText}>Availability: {businessProfile.availability}</Text>
            </View>
          </View>
        </View>

        {/* Verification & Licenses */}
        {businessProfile.hasInsurance && (
          <View style={styles.credentialsCard}>
            <Text style={styles.cardTitle}>Credentials & Verification</Text>

            {businessProfile.hasInsurance && (
              <View style={styles.insuranceSection}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#0066CC" />
                <Text style={styles.insuranceText}>Business Insurance Coverage</Text>
              </View>
            )}
          </View>
        )}

        {/* Management Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Manage Your Business</Text>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleManageServices}>
            <MaterialCommunityIcons name="wrench" size={24} color="#00A651" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Services</Text>
              <Text style={styles.actionDesc}>Update pricing, availability, and service details</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleViewReviews}>
            <MaterialCommunityIcons name="star-outline" size={24} color="#FFC107" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Reviews & Ratings</Text>
              <Text style={styles.actionDesc}>View customer feedback and respond to reviews</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={handleBusinessSettings}>
            <MaterialCommunityIcons name="cog" size={24} color="#8E8E8E" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Business Settings</Text>
              <Text style={styles.actionDesc}>Privacy, notifications, and account settings</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 100,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  coverImage: {
    height: 120,
    backgroundColor: '#F5F5F5',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginTop: 4,
  },
  profileInfo: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
  },
  profileImageContainer: {
    position: 'relative',
    marginTop: -40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 8,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    flex: 1,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FFF9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  verificationText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  subcategory: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 2,
  },
  experience: {
    fontSize: 12,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 4,
  },
  statusSection: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#00A651',
  },
  statusText: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  statusToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusToggleActive: {
    backgroundColor: '#E8F5E8',
    borderColor: '#00A651',
  },
  statusToggleText: {
    fontSize: 12,
    color: '#8E8E8E',
    fontWeight: '600',
  },
  statusToggleTextActive: {
    color: '#00A651',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingVertical: 20,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 16,
  },
  businessDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  credentialsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  licenseSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  licenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  licenseText: {
    fontSize: 12,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  insuranceSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insuranceText: {
    fontSize: 12,
    color: '#2C2C2C',
    marginLeft: 8,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityContent: {
    flex: 1,
    marginLeft: 8,
  },
  activityText: {
    fontSize: 12,
    color: '#2C2C2C',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 10,
    color: '#8E8E8E',
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E8E',
    marginTop: 16,
    textAlign: 'center',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#8E8E8E',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});