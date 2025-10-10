import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { contextAwareGoBack } from '../utils/navigationUtils';
import { useProfile } from '../contexts/ProfileContext';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { SkeletonPlaceholder } from '../components/SkeletonPlaceholder';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const {
    dashboardStats,
    loading: profileLoading,
    error: profileError,
    refreshDashboard
  } = useProfile();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
  };

  // Show error state if there's an error
  if (profileError && !profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => contextAwareGoBack(navigation, 'main')}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.backButton} />
        </View>
        <ErrorState
          title="Failed to Load Dashboard"
          message={profileError}
          onRetry={refreshDashboard}
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
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.backButton} />
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
        {/* Privacy Indicator */}
        <View style={styles.privacyIndicator}>
          <MaterialCommunityIcons name="eye-off" size={16} color="#8E8E8E" />
          <Text style={styles.privacyText}>Only visible to you</Text>
        </View>

        {/* Saved Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Items</Text>

          {profileLoading ? (
            <View style={styles.gridContainer}>
              <SkeletonPlaceholder width="48%" height={120} borderRadius={12} />
              <SkeletonPlaceholder width="48%" height={120} borderRadius={12} />
            </View>
          ) : (
            <View style={styles.gridContainer}>
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Bookmarks' as never, { type: 'post' })}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="bookmark-multiple" size={32} color="#0066CC" />
                </View>
                <Text style={styles.cardCount}>{dashboardStats?.bookmarks.count || 0}</Text>
                <Text style={styles.cardTitle}>Bookmarks</Text>
                <Text style={styles.cardSubtitle}>Saved posts</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('Bookmarks' as never, { type: 'listing' })}
              >
                <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialCommunityIcons name="tag-heart" size={32} color="#FF6B35" />
                </View>
                <Text style={styles.cardCount}>{dashboardStats?.savedDeals.count || 0}</Text>
                <Text style={styles.cardTitle}>Saved Deals</Text>
                <Text style={styles.cardSubtitle}>Local offers</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Events' as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {profileLoading ? (
            <>
              <SkeletonPlaceholder width="100%" height={100} borderRadius={12} style={{ marginBottom: 12 }} />
              <SkeletonPlaceholder width="100%" height={100} borderRadius={12} />
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.eventCard}
                onPress={() => navigation.navigate('MyEvents' as never, { tab: 'attending' })}
              >
                <View style={[styles.eventIconContainer, { backgroundColor: '#F3E5F5' }]}>
                  <MaterialCommunityIcons name="calendar-check" size={28} color="#7B68EE" />
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>Attending</Text>
                  <Text style={styles.eventCount}>
                    {dashboardStats?.events.attending || 0} upcoming events
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E8E" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.eventCard}
                onPress={() => navigation.navigate('MyEvents' as never, { tab: 'organized' })}
              >
                <View style={[styles.eventIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="calendar-star" size={28} color="#00A651" />
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>Organized</Text>
                  <Text style={styles.eventCount}>
                    {dashboardStats?.events.organized || 0} events created
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E8E" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.eventCard}
                onPress={() => navigation.navigate('MyEvents' as never, { tab: 'history' })}
              >
                <View style={[styles.eventIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={28} color="#FF9800" />
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>Event History</Text>
                  <Text style={styles.eventCount}>
                    {dashboardStats?.events.joined || 0} events joined
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E8E" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Community Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Activity</Text>

          {profileLoading ? (
            <View style={styles.gridContainer}>
              <SkeletonPlaceholder width="30%" height={100} borderRadius={12} />
              <SkeletonPlaceholder width="30%" height={100} borderRadius={12} />
              <SkeletonPlaceholder width="30%" height={100} borderRadius={12} />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#F3E5F5' }]}>
                  <MaterialCommunityIcons name="post" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.statNumber}>{dashboardStats?.posts.shared || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialCommunityIcons name="account-heart" size={24} color="#2196F3" />
                </View>
                <Text style={styles.statNumber}>{dashboardStats?.community.neighborsHelped || 0}</Text>
                <Text style={styles.statLabel}>Neighbors Helped</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <MaterialCommunityIcons name="handshake" size={24} color="#00A651" />
                </View>
                <Text style={styles.statNumber}>{dashboardStats?.community.connections || 0}</Text>
                <Text style={styles.statLabel}>Connections</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreatePost' as never)}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#00A651" />
            </View>
            <Text style={styles.actionText}>Create Post</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E8E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateEvent' as never)}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#F3E5F5' }]}>
              <MaterialCommunityIcons name="calendar-plus" size={24} color="#7B68EE" />
            </View>
            <Text style={styles.actionText}>Create Event</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E8E" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateListing' as never)}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="tag-plus" size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>Create Listing</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E8E" />
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  scrollView: {
    flex: 1,
  },
  privacyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  privacyText: {
    fontSize: 13,
    color: '#8E8E8E',
    marginLeft: 6,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
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
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00A651',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8E8E8E',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  eventCount: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '31%',
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2C2C2C',
  },
});
