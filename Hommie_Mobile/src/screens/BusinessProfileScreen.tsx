import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BUSINESS_VERIFICATION_LEVELS, formatNairaCurrency, calculateAverageRating } from '../constants/businessData';
import { ScreenHeader } from '../components/ScreenHeader';

interface BusinessProfile {
  id: string;
  businessName: string;
  description: string;
  category: string;
  subcategory: string;
  serviceArea: string;
  phoneNumber: string;
  whatsappNumber: string;
  businessAddress: string;
  yearsOfExperience: number;
  isVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  profileImage: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTime: string;
  availability: string;
  pricingModel: string;
  licenses: string[];
  hasInsurance: boolean;
  isActive: boolean;
  joinedDate: string;
}

interface BusinessProfileScreenProps {
  navigation?: any;
}

export default function BusinessProfileScreen({ navigation }: BusinessProfileScreenProps) {
  const [businessProfile] = useState<BusinessProfile>({
    id: 'biz_001',
    businessName: "Adebayo's Home Repairs",
    description: 'Professional home repair and maintenance services for your estate. Specializing in plumbing, electrical work, and general handyman services with over 8 years of experience.',
    category: 'household-services',
    subcategory: 'Home Repairs',
    serviceArea: 'neighborhood',
    phoneNumber: '+234 803 123 4567',
    whatsappNumber: '+234 803 123 4567',
    businessAddress: 'Block 5, Flat 3, Victoria Island Estate',
    yearsOfExperience: 8,
    isVerified: true,
    verificationLevel: 'enhanced',
    profileImage: '',
    coverImage: '',
    rating: 4.7,
    reviewCount: 43,
    completedJobs: 127,
    responseTime: '< 2 hours',
    availability: 'business-hours',
    pricingModel: 'fixed-rate',
    licenses: ['Certificate of Incorporation (CAC)', 'Tax Identification Number (TIN)'],
    hasInsurance: true,
    isActive: true,
    joinedDate: '2024-03-15',
  });

  const getVerificationInfo = () => {
    return BUSINESS_VERIFICATION_LEVELS.find(level => level.id === businessProfile.verificationLevel);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Business Profile', 'Navigate to business profile editing screen');
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

  const handleToggleAvailability = () => {
    Alert.alert(
      businessProfile.isActive ? 'Go Offline?' : 'Go Online?',
      businessProfile.isActive 
        ? 'Your business will be hidden from neighbor searches'
        : 'Your business will be visible to neighbors in your service area',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: businessProfile.isActive ? 'Go Offline' : 'Go Online',
          onPress: () => console.log('Toggle business availability')
        }
      ]
    );
  };

  const verificationInfo = getVerificationInfo();

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.detailText}>Service Area: Neighborhood (2km radius)</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="currency-ngn" size={16} color="#8E8E8E" />
              <Text style={styles.detailText}>Pricing: Fixed rate per service</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="clock" size={16} color="#8E8E8E" />
              <Text style={styles.detailText}>Hours: 9 AM - 5 PM, Monday to Friday</Text>
            </View>
          </View>
        </View>

        {/* Verification & Licenses */}
        {(businessProfile.licenses.length > 0 || businessProfile.hasInsurance) && (
          <View style={styles.credentialsCard}>
            <Text style={styles.cardTitle}>Credentials & Verification</Text>
            
            {businessProfile.licenses.length > 0 && (
              <View style={styles.licenseSection}>
                <Text style={styles.subSectionTitle}>Professional Licenses</Text>
                {businessProfile.licenses.map((license, index) => (
                  <View key={index} style={styles.licenseItem}>
                    <MaterialCommunityIcons name="certificate" size={16} color="#00A651" />
                    <Text style={styles.licenseText}>{license}</Text>
                  </View>
                ))}
              </View>
            )}
            
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

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>New 5-star review from Sarah O.</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#00A651" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>Completed job for John A. - Plumbing repair</Text>
              <Text style={styles.activityTime}>1 day ago</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <MaterialCommunityIcons name="message" size={16} color="#0066CC" />
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>New booking request from Mary K.</Text>
              <Text style={styles.activityTime}>2 days ago</Text>
            </View>
          </View>
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
});