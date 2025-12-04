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
import ApiConnectionTest from '../services/apiTest';
import { useProfile } from '../contexts/ProfileContext';

export default function DashboardTestScreen() {
  const navigation = useNavigation();
  
  // ProfileContext hook
  const { 
    profile, 
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

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiTestResults, setApiTestResults] = useState<any>(null);
  const [testingApi, setTestingApi] = useState(false);

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

  const testApiConnection = async () => {
    try {
      setTestingApi(true);
      const results = await ApiConnectionTest.runAllTests();
      setApiTestResults(results);
      
      if (results.overall) {
        Alert.alert('API Test Results', 'All API tests passed! ✅');
      } else {
        Alert.alert('API Test Results', 'Some API tests failed. Check the details below.');
      }
    } catch (error) {
      console.error('API test error:', error);
      Alert.alert('Error', 'Failed to run API tests');
    } finally {
      setTestingApi(false);
    }
  };

  const testProfileContext = async () => {
    try {
      Alert.alert(
        'ProfileContext Test',
        `ProfileContext Status:
        
Profile: ${profile ? '✅ Loaded' : '❌ Not loaded'}
Trust Score: ${trustScore ? '✅ Loaded' : '❌ Not loaded'}
Dashboard Stats: ${contextDashboardStats ? '✅ Loaded' : '❌ Not loaded'}
Profile Completion: ${contextProfileCompletion ? '✅ Loaded' : '❌ Not loaded'}

Loading: ${profileLoading ? '⏳ Yes' : '✅ No'}
Error: ${profileError || '✅ None'}

Profile Name: ${profile ? `${profile.firstName} ${profile.lastName}` : 'N/A'}
Trust Score: ${trustScore ? trustScore.score : 'N/A'}
Profile Completeness: ${contextProfileCompletion ? `${contextProfileCompletion.completionPercentage}%` : 'N/A'}`
      );
    } catch (error) {
      console.error('ProfileContext test error:', error);
      Alert.alert('Error', 'Failed to test ProfileContext');
    }
  };

  const refreshProfileContext = async () => {
    try {
      await Promise.all([
        refreshProfile(),
        refreshTrustScore(),
        refreshDashboard(),
        refreshProfileCompletion(),
      ]);
      Alert.alert('Success', 'ProfileContext data refreshed successfully!');
    } catch (error) {
      console.error('ProfileContext refresh error:', error);
      Alert.alert('Error', 'Failed to refresh ProfileContext data');
    }
  };

  const testNINVerification = async () => {
    try {
      Alert.alert(
        'NIN Verification Test',
        'This will test the NIN verification flow. You can:\n\n1. Navigate to NIN Verification Screen\n2. Test with a valid NIN format\n3. Test error handling with invalid NIN\n4. Test the complete verification flow\n\nNote: This requires a running backend server.',
        [
          {
            text: 'Open NIN Screen',
            onPress: () => navigation.navigate('NINVerification' as never),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          }
        ]
      );
    } catch (error) {
      console.error('NIN verification test error:', error);
      Alert.alert('Error', 'Failed to test NIN verification');
    }
  };

  const testDocumentUpload = async () => {
    try {
      Alert.alert(
        'Document Upload Test',
        'This will test the document upload functionality. You can:\n\n1. Navigate to Document Upload Screen\n2. Test camera/gallery integration\n3. Test document type selection\n4. Test upload to backend API\n5. Test document management\n\nNote: This requires camera/photo library permissions.',
        [
          {
            text: 'Open Document Upload',
            onPress: () => navigation.navigate('DocumentUpload' as never),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          }
        ]
      );
    } catch (error) {
      console.error('Document upload test error:', error);
      Alert.alert('Error', 'Failed to test document upload');
    }
  };

  const testBookmarkFunctionality = async () => {
    try {
      Alert.alert(
        'Bookmark Functionality Test',
        'This will test the bookmark functionality. You can:\n\n1. Test adding bookmarks\n2. Test removing bookmarks\n3. Test bookmark status checking\n4. Test dashboard stats updates\n\nNote: This requires a running backend server.',
        [
          {
            text: 'Test Add Bookmark',
            onPress: async () => {
              try {
                const result = await UserDashboardService.addBookmark('post', 'test-post-123');
                if (result.success) {
                  Alert.alert('Success', 'Bookmark added successfully!');
                  refreshDashboard();
                } else {
                  Alert.alert('Error', result.error || 'Failed to add bookmark');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to add bookmark');
              }
            },
          },
          {
            text: 'Test Remove Bookmark',
            onPress: async () => {
              try {
                const result = await UserDashboardService.removeBookmark('post', 'test-post-123');
                if (result.success) {
                  Alert.alert('Success', 'Bookmark removed successfully!');
                  refreshDashboard();
                } else {
                  Alert.alert('Error', result.error || 'Failed to remove bookmark');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to remove bookmark');
              }
            },
          },
          {
            text: 'Test Toggle Bookmark',
            onPress: async () => {
              try {
                const result = await UserDashboardService.toggleBookmark('post', 'test-post-456');
                if (result.success) {
                  Alert.alert('Success', 'Bookmark toggled successfully!');
                  refreshDashboard();
                } else {
                  Alert.alert('Error', result.error || 'Failed to toggle bookmark');
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to toggle bookmark');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          }
        ]
      );
    } catch (error) {
      console.error('Bookmark functionality test error:', error);
      Alert.alert('Error', 'Failed to test bookmark functionality');
    }
  };

  const testTrustScoreAndDashboard = async () => {
    try {
      Alert.alert(
        'Trust Score & Dashboard Integration Test',
        'This will test the complete trust score and dashboard integration:\n\n1. Trust Score Card display\n2. Dashboard Stats Card display\n3. ProfileContext integration\n4. Real-time data updates\n5. Error handling\n\nNote: This requires a running backend server.',
        [
          {
            text: 'Test Trust Score',
            onPress: async () => {
              try {
                await refreshTrustScore();
                const trustScoreData = trustScore;
                Alert.alert(
                  'Trust Score Data',
                  `Score: ${trustScoreData?.score || 'N/A'}\nLevel: ${trustScoreData?.level || 'N/A'}\nNext Level: ${trustScoreData?.nextLevel || 'N/A'}\nPoints to Next: ${trustScoreData?.pointsToNextLevel || 'N/A'}`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to test trust score');
              }
            },
          },
          {
            text: 'Test Dashboard Stats',
            onPress: async () => {
              try {
                await refreshDashboard();
                const dashboardData = contextDashboardStats;
                Alert.alert(
                  'Dashboard Stats Data',
                  `Bookmarks: ${dashboardData?.bookmarks.count || 0}\nSaved Deals: ${dashboardData?.savedDeals.count || 0}\nEvents: ${dashboardData?.events.attending || 0} attending\nPosts: ${dashboardData?.posts.shared || 0}\nTrust Score: ${dashboardData?.community.trustScore || 0}`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to test dashboard stats');
              }
            },
          },
          {
            text: 'Test Full Integration',
            onPress: async () => {
              try {
                await Promise.all([
                  refreshProfile(),
                  refreshTrustScore(),
                  refreshDashboard(),
                  refreshProfileCompletion(),
                ]);
                Alert.alert('Success', 'All ProfileContext data refreshed successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to test full integration');
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          }
        ]
      );
    } catch (error) {
      console.error('Trust score and dashboard test error:', error);
      Alert.alert('Error', 'Failed to test trust score and dashboard integration');
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

          <TouchableOpacity 
            style={[styles.testButton, testingApi && styles.testButtonDisabled]} 
            onPress={testApiConnection}
            disabled={testingApi}
          >
            {testingApi ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="api" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.testButtonText}>
              {testingApi ? 'Testing API...' : 'Test API Connection'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testProfileContext}>
            <MaterialCommunityIcons name="account-check" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test ProfileContext</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={refreshProfileContext}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Refresh ProfileContext</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testNINVerification}>
            <MaterialCommunityIcons name="card-account-details" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test NIN Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testDocumentUpload}>
            <MaterialCommunityIcons name="file-upload" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Document Upload</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testBookmarkFunctionality}>
            <MaterialCommunityIcons name="bookmark-multiple" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Bookmarks</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testTrustScoreAndDashboard}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Test Trust & Dashboard</Text>
          </TouchableOpacity>
        </View>

        {/* ProfileContext Data Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ProfileContext Data</Text>
          
          {profileLoading ? (
            <ActivityIndicator size="small" color="#00A651" />
          ) : (
            <View style={styles.profileContextContainer}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Profile Status:</Text>
                <Text style={[styles.dataValue, { color: profile ? '#00A651' : '#FF6B6B' }]}>
                  {profile ? '✅ Loaded' : '❌ Not loaded'}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Trust Score:</Text>
                <Text style={[styles.dataValue, { color: trustScore ? '#00A651' : '#FF6B6B' }]}>
                  {trustScore ? `${trustScore.score}/100` : '❌ Not loaded'}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Dashboard Stats:</Text>
                <Text style={[styles.dataValue, { color: contextDashboardStats ? '#00A651' : '#FF6B6B' }]}>
                  {contextDashboardStats ? '✅ Loaded' : '❌ Not loaded'}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Profile Completion:</Text>
                <Text style={[styles.dataValue, { color: contextProfileCompletion ? '#00A651' : '#FF6B6B' }]}>
                  {contextProfileCompletion ? `${contextProfileCompletion.completionPercentage}%` : '❌ Not loaded'}
                </Text>
              </View>
              
              {profileError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Error: {profileError}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* API Test Results */}
        {apiTestResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>API Test Results</Text>
            <View style={styles.apiResultsContainer}>
              <Text style={[
                styles.apiStatusText,
                { color: apiTestResults.overall ? '#00A651' : '#FF6B6B' }
              ]}>
                {apiTestResults.overall ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
              </Text>
              
              <View style={styles.testResultItem}>
                <Text style={styles.testResultLabel}>Connection:</Text>
                <Text style={[
                  styles.testResultValue,
                  { color: apiTestResults.results.connection.success ? '#00A651' : '#FF6B6B' }
                ]}>
                  {apiTestResults.results.connection.success ? 'PASS' : 'FAIL'}
                </Text>
              </View>
              
              <View style={styles.testResultItem}>
                <Text style={styles.testResultLabel}>Authentication:</Text>
                <Text style={[
                  styles.testResultValue,
                  { color: apiTestResults.results.authentication.success ? '#00A651' : '#FF6B6B' }
                ]}>
                  {apiTestResults.results.authentication.success ? 'PASS' : 'FAIL'}
                </Text>
              </View>
              
              <View style={styles.testResultItem}>
                <Text style={styles.testResultLabel}>Verification Service:</Text>
                <Text style={[
                  styles.testResultValue,
                  { color: apiTestResults.results.verification.success ? '#00A651' : '#FF6B6B' }
                ]}>
                  {apiTestResults.results.verification.success ? 'PASS' : 'FAIL'}
                </Text>
              </View>
              
              <View style={styles.testResultItem}>
                <Text style={styles.testResultLabel}>User Profile Service:</Text>
                <Text style={[
                  styles.testResultValue,
                  { color: apiTestResults.results.userProfile.success ? '#00A651' : '#FF6B6B' }
                ]}>
                  {apiTestResults.results.userProfile.success ? 'PASS' : 'FAIL'}
                </Text>
              </View>
            </View>
          </View>
        )}
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
  testButtonDisabled: {
    backgroundColor: '#B0B0B0',
    opacity: 0.7,
  },
  apiResultsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  apiStatusText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  testResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  testResultLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
  },
  testResultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileContextContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C2C2C',
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 8,
  },
});
