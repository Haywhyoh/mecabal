import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { UserDashboardService, DashboardStats, BookmarkItem } from '../services/userDashboard';
import { UserProfileService, ProfileCompletionResponse } from '../services/userProfile';

export default function DashboardTestScreen() {
  const navigation = useNavigation();

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch dashboard stats
      const statsResponse = await UserDashboardService.getDashboardStats();
      if (statsResponse.success && statsResponse.data) {
        setDashboardStats(statsResponse.data);
      } else {
        Alert.alert('Error', statsResponse.error || 'Failed to load dashboard stats');
      }

      // Fetch profile completion
      const completionResponse = await UserProfileService.getProfileCompletion();
      if (completionResponse.success && completionResponse.data) {
        setProfileCompletion(completionResponse.data);
      } else {
        Alert.alert('Error', completionResponse.error || 'Failed to load profile completion');
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const testAddBookmark = async () => {
    try {
      const result = await UserDashboardService.addBookmark('post', 'test-post-123');
      if (result.success) {
        Alert.alert('Success', 'Bookmark added successfully');
        fetchDashboardData(); // Refresh data
      } else {
        Alert.alert('Error', result.error || 'Failed to add bookmark');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add bookmark');
    }
  };

  const testRemoveBookmark = async () => {
    try {
      const result = await UserDashboardService.removeBookmark('post', 'test-post-123');
      if (result.success) {
        Alert.alert('Success', 'Bookmark removed successfully');
        fetchDashboardData(); // Refresh data
      } else {
        Alert.alert('Error', result.error || 'Failed to remove bookmark');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  const testToggleBookmark = async () => {
    try {
      const result = await UserDashboardService.toggleBookmark('post', 'test-post-456');
      if (result.success) {
        Alert.alert('Success', 'Bookmark toggled successfully');
        fetchDashboardData(); // Refresh data
      } else {
        Alert.alert('Error', result.error || 'Failed to toggle bookmark');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle bookmark');
    }
  };

  const testIsBookmarked = async () => {
    try {
      const result = await UserDashboardService.isBookmarked('post', 'test-post-123');
      if (result.success) {
        Alert.alert('Bookmark Status', `Is bookmarked: ${result.data?.isBookmarked ? 'Yes' : 'No'}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to check bookmark status');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check bookmark status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard Test</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00A651"
          />
        }
      >
        {/* Dashboard Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard Statistics</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color="#00A651" />
          ) : dashboardStats ? (
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Bookmarks:</Text>
                <Text style={styles.statValue}>{dashboardStats.bookmarks.count}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Saved Deals:</Text>
                <Text style={styles.statValue}>{dashboardStats.savedDeals.count}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Events Attending:</Text>
                <Text style={styles.statValue}>{dashboardStats.events.attending}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Events Organized:</Text>
                <Text style={styles.statValue}>{dashboardStats.events.organized}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Events Joined:</Text>
                <Text style={styles.statValue}>{dashboardStats.events.joined}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Posts Shared:</Text>
                <Text style={styles.statValue}>{dashboardStats.posts.shared}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Neighbors Helped:</Text>
                <Text style={styles.statValue}>{dashboardStats.community.neighborsHelped}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Trust Score:</Text>
                <Text style={styles.statValue}>{dashboardStats.community.trustScore}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Last Updated:</Text>
                <Text style={styles.statValue}>
                  {new Date(dashboardStats.lastUpdated).toLocaleString()}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.errorText}>Failed to load dashboard stats</Text>
          )}
        </View>

        {/* Profile Completion */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Completion</Text>
          
          {isLoading ? (
            <ActivityIndicator size="small" color="#00A651" />
          ) : profileCompletion ? (
            <View style={styles.completionContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${profileCompletion.percentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.percentageText}>{profileCompletion.percentage}% Complete</Text>
              {profileCompletion && profileCompletion.missingFields && profileCompletion.missingFields.length > 0 && (
                <View style={styles.missingFieldsContainer}>
                  <Text style={styles.missingFieldsTitle}>Missing Fields:</Text>
                  {profileCompletion.missingFields.map((field, index) => (
                    <Text key={index} style={styles.missingField}>• {field}</Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.errorText}>Failed to load profile completion</Text>
          )}
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Functions</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testAddBookmark}>
            <MaterialCommunityIcons name="bookmark-plus" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Add Bookmark</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testRemoveBookmark}>
            <MaterialCommunityIcons name="bookmark-minus" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Remove Bookmark</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testToggleBookmark}>
            <MaterialCommunityIcons name="bookmark-toggle" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Toggle Bookmark</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testIsBookmarked}>
            <MaterialCommunityIcons name="bookmark-check" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Check Bookmark</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButton} 
            onPress={() => navigation.navigate('Bookmarks' as never, { type: 'post' })}
          >
            <MaterialCommunityIcons name="bookmark-multiple" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>View Bookmarks Screen</Text>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  statsContainer: {
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statLabel: {
    fontSize: 16,
    color: '#2C2C2C',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: '#00A651',
    fontWeight: '600',
  },
  completionContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00A651',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
    marginBottom: 12,
  },
  missingFieldsContainer: {
    marginTop: 8,
  },
  missingFieldsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  missingField: {
    fontSize: 12,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: '#00A651',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 8,
  },
});
