import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, BORDER_RADIUS, shadows } from '../constants';
import { ScreenHeader } from '../components/ScreenHeader';
import { MetricsCard } from '../components/analytics/MetricsCard';
import { AnalyticsChart } from '../components/analytics/AnalyticsChart';
import { businessAnalyticsApi } from '../services/api/businessAnalyticsApi';
import { AnalyticsOverview, DailyStat, Activity } from '../services/types/api.types';

interface Props {
  route: {
    params: {
      businessId: string;
      businessName: string;
    };
  };
  navigation: any;
}

type Period = '7d' | '30d' | '90d' | 'all';

export default function BusinessAnalyticsScreen({ route, navigation }: Props) {
  const { businessId, businessName } = route.params;

  // State
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Period selection
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');

  // Load data on mount
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all analytics data in parallel
      const [overviewData, dailyData, activityData] = await Promise.all([
        businessAnalyticsApi.getAnalytics(businessId, selectedPeriod),
        businessAnalyticsApi.getDailyStats(businessId, getDaysForPeriod(selectedPeriod)),
        businessAnalyticsApi.getRecentActivity(businessId, 20),
      ]);

      setOverview(overviewData);
      setDailyStats(dailyData);
      setRecentActivity(activityData);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data');
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
  }, [selectedPeriod]);

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
  };

  const getDaysForPeriod = (period: Period): number => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case 'all': return 365;
      default: return 30;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatActivityType = (activityType: string) => {
    switch (activityType) {
      case 'view': return 'Profile View';
      case 'contact-click': return 'Contact Click';
      case 'inquiry': return 'New Inquiry';
      case 'booking': return 'New Booking';
      case 'review': return 'New Review';
      default: return activityType;
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'view': return 'eye';
      case 'contact-click': return 'phone';
      case 'inquiry': return 'message-text';
      case 'booking': return 'calendar';
      case 'review': return 'star';
      default: return 'circle';
    }
  };

  const renderPeriodSelector = () => {
    const periods: { key: Period; label: string }[] = [
      { key: '7d', label: '7 Days' },
      { key: '30d', label: '30 Days' },
      { key: '90d', label: '90 Days' },
      { key: 'all', label: 'All Time' },
    ];

    return (
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => handlePeriodChange(period.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderOverviewMetrics = () => {
    if (!overview) return null;

    return (
      <View style={styles.metricsGrid}>
        <MetricsCard
          title="Total Views"
          value={overview.totalViews}
          subtitle="All time"
          trend="up"
          trendValue="+12%"
          icon="eye"
          iconColor={colors.accent.trustBlue}
        />
        
        <MetricsCard
          title="Contact Clicks"
          value={overview.totalContactClicks}
          subtitle="All time"
          trend="up"
          trendValue="+8%"
          icon="phone"
          iconColor={colors.accent.lagosOrange}
        />
        
        <MetricsCard
          title="Inquiries"
          value={overview.totalInquiries}
          subtitle="All time"
          trend="up"
          trendValue="+15%"
          icon="message-text"
          iconColor={colors.accent.neighborPurple}
        />
        
        <MetricsCard
          title="Conversion Rate"
          value={`${overview.conversionRate.toFixed(1)}%`}
          subtitle="This period"
          trend="up"
          trendValue="+2.1%"
          icon="trending-up"
          iconColor={colors.success}
        />
      </View>
    );
  };

  const renderCharts = () => {
    if (dailyStats.length === 0) return null;

    // Prepare data for charts
    const chartData = {
      labels: dailyStats.slice(-7).map(stat => formatDate(stat.date)),
      datasets: [
        {
          data: dailyStats.slice(-7).map(stat => stat.views),
          color: (opacity = 1) => `rgba(0, 166, 81, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    const conversionData = {
      labels: dailyStats.slice(-7).map(stat => formatDate(stat.date)),
      datasets: [
        {
          data: dailyStats.slice(-7).map(stat => stat.contacts),
          color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
        },
        {
          data: dailyStats.slice(-7).map(stat => stat.inquiries),
          color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
        },
      ],
    };

    const inquiryTypeData = [
      {
        name: 'Booking',
        population: overview.totalBookings,
        color: colors.accent.trustBlue,
        legendFontColor: colors.text.dark,
        legendFontSize: 12,
      },
      {
        name: 'Question',
        population: overview.totalInquiries - overview.totalBookings,
        color: colors.accent.neighborPurple,
        legendFontColor: colors.text.dark,
        legendFontSize: 12,
      },
    ];

    return (
      <View>
        <AnalyticsChart
          type="line"
          title="Daily Views"
          data={chartData}
          height={200}
          showDots={true}
        />
        
        <AnalyticsChart
          type="bar"
          title="Contacts vs Inquiries"
          data={conversionData}
          height={200}
          showValues={true}
        />
        
        <AnalyticsChart
          type="pie"
          title="Inquiry Types"
          data={inquiryTypeData}
          height={200}
        />
      </View>
    );
  };

  const renderRecentActivity = () => {
    if (recentActivity.length === 0) return null;

    return (
      <View style={styles.activitySection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recentActivity.slice(0, 10).map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <MaterialCommunityIcons
                name={getActivityIcon(activity.activityType) as any}
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityText}>
                {formatActivityType(activity.activityType)}
              </Text>
              <Text style={styles.activityTime}>
                {new Date(activity.createdAt).toLocaleString()}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLoadingState = () => {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  };

  const renderErrorState = () => {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons
          name="chart-line"
          size={64}
          color={colors.text.tertiary}
        />
        <Text style={styles.errorTitle}>Failed to Load Analytics</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadAnalyticsData}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && !overview) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title={`Analytics - ${businessName}`}
          navigation={navigation}
        />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  if (error && !overview) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader
          title={`Analytics - ${businessName}`}
          navigation={navigation}
        />
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={`Analytics - ${businessName}`}
        navigation={navigation}
        rightComponent={
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="refresh"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Period Selector */}
        {renderPeriodSelector()}

        {/* Overview Metrics */}
        {renderOverviewMetrics()}

        {/* Charts */}
        {renderCharts()}

        {/* Recent Activity */}
        {renderRecentActivity()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  refreshButton: {
    padding: spacing.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: colors.lightGreen,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: colors.white,
    alignItems: 'center',
    ...shadows.small,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
  },
  periodButtonTextActive: {
    color: colors.white,
  },
  metricsGrid: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  loadingText: {
    fontSize: typography.sizes.callout,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryButtonText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  activitySection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: typography.sizes.callout,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: typography.sizes.caption1,
    color: colors.text.tertiary,
  },
});
