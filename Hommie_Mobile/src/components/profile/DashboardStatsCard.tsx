import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { DashboardStats } from '../contexts/ProfileContext';

interface DashboardStatsCardProps {
  dashboardStats: DashboardStats | null;
  loading?: boolean;
  onStatPress?: (statType: string, data: any) => void;
  compact?: boolean;
  onViewAll?: () => void;
}

export default function DashboardStatsCard({
  dashboardStats,
  loading = false,
  onStatPress,
  compact = false,
  onViewAll,
}: DashboardStatsCardProps) {
  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="loading" size={24} color="#8E8E8E" />
          <Text style={styles.loadingText}>Loading dashboard stats...</Text>
        </View>
      </View>
    );
  }

  if (!dashboardStats) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={24} color="#E74C3C" />
          <Text style={styles.errorText}>Unable to load dashboard stats</Text>
        </View>
      </View>
    );
  }

  const stats = [
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      count: dashboardStats.bookmarks.count,
      icon: 'bookmark-multiple',
      color: '#00A651',
      description: 'Saved items',
    },
    {
      id: 'savedDeals',
      title: 'Saved Deals',
      count: dashboardStats.savedDeals.count,
      icon: 'tag-heart',
      color: '#FF9800',
      description: 'Deals saved',
    },
    {
      id: 'events',
      title: 'Events',
      count: dashboardStats.events.attending + dashboardStats.events.organized,
      icon: 'calendar-star',
      color: '#2196F3',
      description: `${dashboardStats.events.attending} attending, ${dashboardStats.events.organized} organized`,
    },
    {
      id: 'posts',
      title: 'Posts',
      count: dashboardStats.posts.shared,
      icon: 'post',
      color: '#9C27B0',
      description: 'Posts shared',
    },
    {
      id: 'community',
      title: 'Community',
      count: dashboardStats.community.neighborsHelped,
      icon: 'account-heart',
      color: '#E91E63',
      description: 'Neighbors helped',
    },
    {
      id: 'trustScore',
      title: 'Trust Score',
      count: dashboardStats.community.trustScore,
      icon: 'shield-check',
      color: '#4CAF50',
      description: 'Community trust',
    },
  ];

  const renderStatItem = (stat: any) => (
    <TouchableOpacity
      key={stat.id}
      style={styles.statItem}
      onPress={() => onStatPress?.(stat.id, stat)}
      activeOpacity={0.7}
    >
      <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
        <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statCount}>{stat.count}</Text>
        <Text style={styles.statTitle}>{stat.title}</Text>
        <Text style={styles.statDescription}>{stat.description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
    </TouchableOpacity>
  );

  const renderCompactStatItem = (stat: any) => (
    <TouchableOpacity
      key={stat.id}
      style={styles.compactStatCard}
      onPress={() => onStatPress?.(stat.id, stat)}
      activeOpacity={0.7}
    >
      <View style={[styles.compactIconCircle, { backgroundColor: stat.color + '20' }]}>
        <MaterialCommunityIcons name={stat.icon as any} size={32} color={stat.color} />
      </View>
      <Text style={styles.compactStatNumber}>{stat.count}</Text>
      <Text style={styles.compactStatLabel}>{stat.title}</Text>
    </TouchableOpacity>
  );

  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.compactContainer}
        >
          {/* Render first 3 stats as small cards */}
          {stats.slice(0, 3).map(renderCompactStatItem)}

          {/* View All button */}
          <TouchableOpacity
            style={styles.viewAllCard}
            onPress={onViewAll}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-right-circle" size={32} color="#00A651" />
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name="chart-line" size={20} color="#2C2C2C" />
          <Text style={styles.title}>Dashboard Stats</Text>
        </View>
        <Text style={styles.lastUpdated}>
          Updated {new Date(dashboardStats.lastUpdated).toLocaleDateString()}
        </Text>
      </View>

      <ScrollView 
        style={styles.statsContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {stats.map(renderStatItem)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  containerCompact: {
    padding: 16,
    borderRadius: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  statsContainer: {
    maxHeight: 300,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  statDescription: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  // Compact mode styles
  compactContainer: {
    paddingVertical: 8,
  },
  compactStatCard: {
    width: 120,
    height: 120,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // Apple-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  compactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  compactStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  compactStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  viewAllCard: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F9F4',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00A651',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00A651',
    marginTop: 8,
  },
});
