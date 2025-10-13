import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import ErrorView from '../components/ErrorView';
import { EventsApi, handleApiError } from '../services/EventsApi';
import type { Event } from '../services/EventsApi';
import { colors, spacing, typography, shadows } from '../constants';

const { width } = Dimensions.get('window');

interface CategoryEventsScreenProps {
  route: {
    params: {
      categoryId: number;
      categoryName: string;
      categoryColor: string;
    };
  };
  navigation: any;
}

export default function CategoryEventsScreen({ route, navigation }: CategoryEventsScreenProps) {
  const { categoryId, categoryName, categoryColor } = route.params;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch category events
  const fetchCategoryEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await EventsApi.getEvents({ categoryId });
      setEvents(response.data || []);
    } catch (err) {
      setError(handleApiError(err));
      console.error('Error fetching category events:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  // Initial load
  useEffect(() => {
    fetchCategoryEvents();
  }, [fetchCategoryEvents]);

  // Refresh handler
  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await fetchCategoryEvents();
    } catch (err) {
      console.error('Error refreshing category events:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle event press
  const handleEventPress = (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EventDetails', { eventId: event.id });
  };

  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      {[1, 2, 3, 4, 5].map((index) => (
        <EventCardSkeleton key={index} />
      ))}
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons 
        name="calendar-remove" 
        size={64} 
        color={colors.neutral.lightGray} 
      />
      <Text style={styles.emptyStateTitle}>No Events Yet</Text>
      <Text style={styles.emptyStateText}>
        No {categoryName.toLowerCase()} events scheduled at the moment.
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Check back later or explore other categories.
      </Text>
    </View>
  );

  // Render events list
  const renderEventsList = () => (
    <View style={styles.eventsList}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onPress={() => handleEventPress(event)}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with category color accent */}
      <View style={[styles.header, { borderBottomColor: categoryColor }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityHint="Return to events screen"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{categoryName} Events</Text>
          <Text style={styles.headerSubtitle}>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={categoryColor}
            colors={[categoryColor]}
          />
        }
      >
        {loading ? (
          renderLoadingState()
        ) : error ? (
          <ErrorView 
            error={error} 
            onRetry={() => fetchCategoryEvents()} 
          />
        ) : events.length === 0 ? (
          renderEmptyState()
        ) : (
          renderEventsList()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.bold,
    color: colors.text.dark,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.sizes.subhead,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.md,
  },
  eventsList: {
    padding: spacing.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.title2,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.body,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.sizes.subhead,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: typography.lineHeights.subhead,
  },
});


