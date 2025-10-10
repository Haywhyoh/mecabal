import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../contexts/ProfileContext';
import { HapticFeedback } from '../utils/haptics';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { dashboardStats, loading, refreshDashboard } = useProfile();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    HapticFeedback.medium(); // Haptic feedback on refresh
    
    try {
      await refreshDashboard();
      HapticFeedback.success();
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      HapticFeedback.error();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            HapticFeedback.light();
            navigation.goBack();
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00A651"
          />
        }
      >
        {/* Privacy Indicator */}
        <View style={styles.privacyBanner}>
          <MaterialCommunityIcons name="eye-off" size={16} color="#8E8E93" />
          <Text style={styles.privacyText}>Only visible to you</Text>
        </View>

        {/* Saved Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Items</Text>
          <View style={styles.gridContainer}>
            {/* Bookmarks Card */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('Bookmarks' as never, { type: 'post' })}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="bookmark-multiple" size={32} color="#0066CC" />
              </View>
              <Text style={styles.gridCardNumber}>
                {dashboardStats?.bookmarks.count || 0}
              </Text>
              <Text style={styles.gridCardLabel}>Bookmarks</Text>
              <Text style={styles.gridCardSubtitle}>Saved posts</Text>
            </TouchableOpacity>

            {/* Saved Deals Card */}
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => navigation.navigate('Bookmarks' as never, { type: 'listing' })}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                <MaterialCommunityIcons name="tag-heart" size={32} color="#FF6B35" />
              </View>
              <Text style={styles.gridCardNumber}>
                {dashboardStats?.savedDeals.count || 0}
              </Text>
              <Text style={styles.gridCardLabel}>Saved Deals</Text>
              <Text style={styles.gridCardSubtitle}>Local offers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Events Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Events</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Events' as never)}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Attending Events */}
          <TouchableOpacity style={styles.listItem}>
            <View style={[styles.listIconCircle, { backgroundColor: '#F3E5F5' }]}>
              <MaterialCommunityIcons name="calendar-check" size={24} color="#7B68EE" />
            </View>
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>Attending</Text>
              <Text style={styles.listSubtitle}>
                {dashboardStats?.events.attending || 0} upcoming events
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          {/* Organized Events */}
          <TouchableOpacity style={styles.listItem}>
            <View style={[styles.listIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="star" size={24} color="#00A651" />
            </View>
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>Organized</Text>
              <Text style={styles.listSubtitle}>
                {dashboardStats?.events.organized || 0} events created
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          {/* Event History */}
          <TouchableOpacity style={styles.listItem}>
            <View style={[styles.listIconCircle, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="history" size={24} color="#FF9800" />
            </View>
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>History</Text>
              <Text style={styles.listSubtitle}>
                {dashboardStats?.events.joined || 0} events joined
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Community Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Activity</Text>
          <View style={styles.statsGrid}>
            {/* Posts Stat */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#F3E5F5' }]}>
                <MaterialCommunityIcons name="post" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.statNumber}>
                {dashboardStats?.posts.shared || 0}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>

            {/* Neighbors Helped Stat */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#E8F5E9' }]}>
                <MaterialCommunityIcons name="account-heart" size={24} color="#00A651" />
              </View>
              <Text style={styles.statNumber}>
                {dashboardStats?.community.neighborsHelped || 0}
              </Text>
              <Text style={styles.statLabel}>Helped</Text>
            </View>

            {/* Connections Stat */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#E3F2FD' }]}>
                <MaterialCommunityIcons name="account-group" size={24} color="#2196F3" />
              </View>
              <Text style={styles.statNumber}>
                {dashboardStats?.community.connections || 0}
              </Text>
              <Text style={styles.statLabel}>Links</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="plus-circle" size={24} color="#00A651" />
            </View>
            <Text style={styles.actionText}>Create Post</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconCircle, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="calendar-plus" size={24} color="#2196F3" />
            </View>
            <Text style={styles.actionText}>Create Event</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={[styles.actionIconCircle, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="store" size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>Add Business</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',  // Apple's system background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.4,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  privacyText: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 6,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
    color: '#1C1C1E',
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  seeAllButton: {
    fontSize: 15,
    color: '#00A651',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    // Apple-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridCardNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  gridCardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  gridCardSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  listIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    // Apple-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
  },
});