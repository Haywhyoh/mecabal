import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { contextAwareGoBack } from '../utils/navigationUtils';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();

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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>A</Text>
            </View>
            <TouchableOpacity style={styles.cameraButton}>
              <MaterialCommunityIcons name="camera" size={16} color="#2C2C2C" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>Adebayo Ogundimu</Text>
          <TouchableOpacity style={styles.locationContainer} onPress={() => navigation.navigate('EstateManager' as never)}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#8E8E8E" />
            <Text style={styles.userLocation}>Victoria Island, Lagos</Text>
            <Text style={styles.estateCount}>• 3 estates</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#8E8E8E" style={styles.chevron} />
          </TouchableOpacity>
          
          <Text style={styles.joinDate}>Member since August 2024</Text>
          <View style={styles.verificationBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#00A651" />
            <Text style={styles.verifiedText}>Verified Estate Resident</Text>
          </View>
        </View>

        {/* Find Neighbors CTA */}
        <TouchableOpacity style={styles.findNeighborsCard}>
          <View style={styles.findNeighborsContent}>
            <Text style={styles.findNeighborsTitle}>Find and connect with neighbors</Text>
            <Text style={styles.findNeighborsSubtitle}>Discover people in your estate and build connections</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E8E" />
        </TouchableOpacity>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.editProfileButton}>
          <MaterialCommunityIcons name="pencil" size={20} color="#2C2C2C" />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>

        {/* Dashboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dashboard</Text>
            <View style={styles.privacyIndicator}>
              <MaterialCommunityIcons name="eye-off" size={14} color="#8E8E8E" />
              <Text style={styles.privacyText}>Only visible to you</Text>
            </View>
          </View>
          
          <View style={styles.dashboardGrid}>
            <TouchableOpacity style={styles.dashboardCard}>
              <MaterialCommunityIcons name="bookmark" size={24} color="#0066CC" />
              <Text style={styles.dashboardTitle}>Bookmarks</Text>
              <Text style={styles.dashboardCount}>12 saved posts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dashboardCard}>
              <MaterialCommunityIcons name="tag" size={24} color="#FF6B35" />
              <Text style={styles.dashboardTitle}>Saved Deals</Text>
              <Text style={styles.dashboardCount}>3 local offers</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.dashboardCard}>
            <MaterialCommunityIcons name="calendar" size={24} color="#7B68EE" />
            <Text style={styles.dashboardTitle}>Events</Text>
            <Text style={styles.dashboardCount}>5 upcoming events you're attending</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Enhancement */}
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

        {/* Community Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Community Impact</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>Posts Shared</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>47</Text>
              <Text style={styles.statLabel}>Neighbors Helped</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Events Joined</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons name="account-edit" size={20} color="#00A651" />
            <Text style={styles.actionText}>Account Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons name="shield-account" size={20} color="#0066CC" />
            <Text style={styles.actionText}>Privacy & Safety</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons name="bell" size={20} color="#FF6B35" />
            <Text style={styles.actionText}>Notifications</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <MaterialCommunityIcons name="help-circle" size={20} color="#8E8E8E" />
            <Text style={styles.actionText}>Help & Support</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
          </TouchableOpacity>
        </View>

        {/* Business Profile Option */}
        <TouchableOpacity style={styles.businessCard} onPress={() => navigation.navigate('BusinessRegistration' as never)}>
          <MaterialCommunityIcons name="plus-circle" size={20} color="#00A651" />
          <Text style={styles.businessText}>Add business page</Text>
        </TouchableOpacity>

        {/* Sign Out */}
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00A651',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 8,
    textAlign: 'center',
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
    color: '#8E8E8E',
    marginLeft: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 12,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  verifiedText: {
    fontSize: 14,
    color: '#00A651',
    fontWeight: '600',
    marginLeft: 4,
  },
  findNeighborsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  findNeighborsContent: {
    flex: 1,
  },
  findNeighborsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  findNeighborsSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  editProfileButton: {
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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
    color: '#2C2C2C',
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 12,
    color: '#8E8E8E',
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
    color: '#2C2C2C',
    marginBottom: 8,
  },
  enhancementSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 20,
    marginBottom: 16,
  },
  bioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 8,
  },
  bioContent: {
    flex: 1,
    marginLeft: 12,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  bioSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00A651',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#2C2C2C',
    marginLeft: 12,
  },
  businessCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  businessText: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
    marginLeft: 12,
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
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '500',
    marginLeft: 8,
  },
});
