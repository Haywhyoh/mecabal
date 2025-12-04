import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  RefreshControl,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { EventCard, EventCardSkeleton } from '../../components/events';
import { ErrorView } from '../../components/ui';
import { EventsCalendarView, EventsMapView } from '../../components/events';
import { EventsApi, handleApiError, EVENT_CATEGORIES } from '../../services/EventsApi';
import type { Event, EventFilterDto } from '../../services/EventsApi';
import { colors, spacing, typography, shadows } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

type ViewMode = 'list' | 'calendar' | 'map';
type QuickFilter = 'upcoming' | 'this_weekend' | 'this_month' | 'my_events';

interface EventsScreenProps {
  navigation: any;
}

export default function EventsScreen({ navigation }: EventsScreenProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<QuickFilter>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({
    start: null,
    end: null
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get user location from profile
  const userEstate = user?.estate || 'Your Estate';
  const userCity = user?.city || 'Your City';
  const userState = user?.state || 'Lagos';

  // Fetch events from API
  const fetchEvents = useCallback(async (filters: EventFilterDto = {}) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      const baseFilters = { ...filters };

      if (dateRange.start && dateRange.end) {
        baseFilters.dateFrom = dateRange.start.toISOString().split('T')[0];
        baseFilters.dateTo = dateRange.end.toISOString().split('T')[0];
      } else {
        const now = new Date();
        switch (selectedQuickFilter) {
          case 'upcoming':
            baseFilters.dateFrom = now.toISOString().split('T')[0];
            break;
          case 'this_weekend':
            const saturday = new Date(now);
            saturday.setDate(now.getDate() + (6 - now.getDay()));
            const sunday = new Date(saturday);
            sunday.setDate(saturday.getDate() + 1);
            baseFilters.dateFrom = saturday.toISOString().split('T')[0];
            baseFilters.dateTo = sunday.toISOString().split('T')[0];
            break;
          case 'this_month':
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            baseFilters.dateFrom = startOfMonth.toISOString().split('T')[0];
            baseFilters.dateTo = endOfMonth.toISOString().split('T')[0];
            break;
          case 'my_events':
            response = await EventsApi.getMyEvents('all', baseFilters);
            setEvents(response.data || []);
            return;
        }
      }

      response = await EventsApi.getEvents(baseFilters);
      setEvents(response.data || []);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedQuickFilter, dateRange]);

  const fetchFeaturedEvents = useCallback(async () => {
    try {
      const featured = await EventsApi.getFeaturedEvents(5);
      setFeaturedEvents(featured || []);
    } catch (err) {
      console.error('Error fetching featured events:', err);
      setFeaturedEvents([]);
    }
  }, []);

  const fetchMyEvents = useCallback(async () => {
    try {
      const myEventsResponse = await EventsApi.getMyEvents('all', {});
      setMyEvents(myEventsResponse.data || []);
    } catch (err) {
      console.error('Error fetching my events:', err);
      setMyEvents([]);
    }
  }, []);


  const fetchUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (err) {
      console.error('Error fetching user location:', err);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchEvents({ search: searchQuery.trim() });
      } else {
        fetchEvents();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchEvents]);

  useEffect(() => {
    if (selectedCategories.length > 0) {
      fetchEvents({ categoryId: selectedCategories[0] });
    } else {
      fetchEvents();
    }
  }, [selectedCategories, fetchEvents]);

  useEffect(() => {
    fetchEvents();
    fetchFeaturedEvents();
    fetchMyEvents();
    fetchUserLocation();
  }, [fetchEvents, fetchFeaturedEvents, fetchMyEvents, fetchUserLocation]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEvents(),
        fetchFeaturedEvents(),
        fetchMyEvents(),
        fetchUserLocation()
      ]);
    } catch (err) {
      console.error('Error refreshing events:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleCategoryFilter = (categoryId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [categoryId]
    );
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategories([]);
    setSearchQuery('');
    setSelectedQuickFilter('upcoming');
    setDateRange({ start: null, end: null });
  };

  const handleQuickFilter = (filter: QuickFilter) => {
    Haptics.selectionAsync();
    setSelectedQuickFilter(filter);
    setDateRange({ start: null, end: null });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    Haptics.selectionAsync();
    setViewMode(mode);
  };

  const handleEventPress = (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EventDetails', { eventId: event.id });
  };


  const renderFeaturedEvents = () => {
    if (!featuredEvents || featuredEvents.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitle}>Featured in {userEstate}</Text>
        </View>
        <FlatList
          data={featuredEvents}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => handleEventPress(item)}
              activeOpacity={0.95}
            >
              <View style={[styles.featuredCardIcon, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="star" size={24} color={colors.primary} />
              </View>
              <View style={styles.featuredCardContent}>
                <Text style={styles.featuredCardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.featuredCardSubtitle} numberOfLines={1}>
                  {(() => {
                    try {
                      const date = new Date(item.eventDate);
                      if (isNaN(date.getTime())) return 'Date TBA';
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      });
                    } catch {
                      return 'Date TBA';
                    }
                  })()}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.neutral.gray} />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => `featured_${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            {/* Top Navigation Row */}
            <View style={styles.topNavRow}>
              {navigation.canGoBack() && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.goBack();
                  }}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {/* iOS Segmented Control */}
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[styles.segmentButton, viewMode === 'list' && styles.segmentButtonActive]}
                  onPress={() => handleViewModeChange('list')}
                >
                  <MaterialCommunityIcons
                    name="view-list"
                    size={18}
                    color={viewMode === 'list' ? colors.primary : colors.neutral.gray}
                  />
                </TouchableOpacity>
                <View style={styles.segmentDivider} />
                <TouchableOpacity
                  style={[styles.segmentButton, viewMode === 'calendar' && styles.segmentButtonActive]}
                  onPress={() => handleViewModeChange('calendar')}
                >
                  <MaterialCommunityIcons
                    name="calendar-month"
                    size={18}
                    color={viewMode === 'calendar' ? colors.primary : colors.neutral.gray}
                  />
                </TouchableOpacity>
                <View style={styles.segmentDivider} />
                <TouchableOpacity
                  style={[styles.segmentButton, viewMode === 'map' && styles.segmentButtonActive]}
                  onPress={() => handleViewModeChange('map')}
                >
                  <MaterialCommunityIcons
                    name="map"
                    size={18}
                    color={viewMode === 'map' ? colors.primary : colors.neutral.gray}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Location Row */}
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color={colors.primary} />
              <Text style={styles.locationText}>{userEstate}</Text>
              <Text style={styles.locationSubtext}>{` • ${userCity}, ${userState}`}</Text>
            </View>

            {/* Large Title */}
            <View style={styles.largeTitleContainer}>
              <Text style={styles.largeTitle}>Events</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <View style={styles.searchBar}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.neutral.gray} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search events..."
                  placeholderTextColor={colors.neutral.gray}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <MaterialCommunityIcons name="close-circle" size={18} color={colors.neutral.gray} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.filterIconButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowFilters(true);
                }}
              >
                <MaterialCommunityIcons
                  name="tune-variant"
                  size={22}
                  color={selectedCategories.length > 0 ? colors.primary : colors.text.dark}
                />
                {selectedCategories.length > 0 && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{selectedCategories.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Quick Filters - Horizontal Pills */}
            <View style={styles.quickFilterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickFilterContent}
              >
                {(['upcoming', 'this_weekend', 'this_month', 'my_events'] as QuickFilter[]).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.quickFilterPill,
                      selectedQuickFilter === filter && styles.quickFilterPillActive
                    ]}
                    onPress={() => handleQuickFilter(filter)}
                  >
                    <Text style={[
                      styles.quickFilterText,
                      selectedQuickFilter === filter && styles.quickFilterTextActive
                    ]}>
                      {filter === 'upcoming' ? 'Upcoming' :
                       filter === 'this_weekend' ? 'This Weekend' :
                       filter === 'this_month' ? 'This Month' : 'My Events'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {selectedQuickFilter !== 'my_events' && renderFeaturedEvents()}

        {selectedQuickFilter !== 'my_events' && myEvents.length > 0 && (
          <TouchableOpacity
            style={styles.myEventsCard}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedQuickFilter('my_events');
            }}
            activeOpacity={0.9}
          >
            <View style={styles.myEventsIcon}>
              <MaterialCommunityIcons name="calendar-check" size={24} color={colors.primary} />
            </View>
            <View style={styles.myEventsContent}>
              <Text style={styles.myEventsTitle}>Your Events</Text>
              <Text style={styles.myEventsCount}>{myEvents.length} upcoming</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.neutral.gray} />
          </TouchableOpacity>
        )}


        {/* Events List */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionTitle}>
              {selectedQuickFilter === 'upcoming' ? 'Upcoming Events' :
               selectedQuickFilter === 'this_weekend' ? 'This Weekend' :
               selectedQuickFilter === 'this_month' ? 'This Month' :
               selectedQuickFilter === 'my_events' ? 'Your Events' : 'Events'}
            </Text>
            <Text style={styles.eventsCount}>{events.length}</Text>
          </View>

          {viewMode === 'list' && (
            <View style={styles.eventsList}>
              {loading ? (
                <>
                  {[1, 2, 3, 4].map((index) => (
                    <EventCardSkeleton key={index} />
                  ))}
                </>
              ) : error ? (
                <ErrorView error={error} onRetry={() => fetchEvents()} />
              ) : events.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIcon}>
                    <MaterialCommunityIcons name="calendar-blank" size={64} color={colors.neutral.lightGray} />
                  </View>
                  <Text style={styles.emptyStateTitle}>No Events Found</Text>
                  <Text style={styles.emptyStateMessage}>
                    {searchQuery ? 'Try adjusting your search' :
                     selectedQuickFilter === 'my_events' ? 'You haven\'t joined any events yet' :
                     'No events scheduled for this period'}
                  </Text>
                </View>
              ) : (
                events.map((event) => (
                  <View key={event.id} style={{ width: '100%' }}>
                    {/* ADD wrapper - this is valid (not a string), so not the cause of the error! */}
                    <EventCard
                      event={event}
                      onPress={() => handleEventPress(event)}
                    />
                  </View>
                ))
              )}
            </View>
          )}

          {viewMode === 'calendar' && (
            <EventsCalendarView
              events={events}
              onDateSelect={(date) => console.log(date)}
              onEventPress={handleEventPress}
            />
          )}

          {viewMode === 'map' && (
            <EventsMapView
              events={events}
              userLocation={userLocation}
              onEventPress={handleEventPress}
            />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('CreateEvent');
        }}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.modalClear}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSectionTitle}>CATEGORIES</Text>
            <View style={styles.modalCategoryGrid}>
              {EVENT_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.modalCategoryItem,
                      isSelected && { backgroundColor: category.colorCode, borderColor: category.colorCode }
                    ]}
                    onPress={() => toggleCategoryFilter(category.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={category.icon as any}
                      size={28}
                      color={isSelected ? colors.white : category.colorCode}
                    />
                    <Text style={[
                      styles.modalCategoryName,
                      { color: isSelected ? colors.white : colors.text.dark }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalApplyButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowFilters(false);
              }}
            >
              <Text style={styles.modalApplyText}>Show Results</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS system background
    zIndex: 0,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    zIndex: 1000,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    paddingHorizontal: spacing.md,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? spacing.xs : spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.dark,
  },
  locationSubtext: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.neutral.gray,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 9,
    padding: 2,
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  segmentButtonActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60, 60, 67, 0.18)',
  },
  largeTitleContainer: {
    marginTop: spacing.md,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: colors.text.dark,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? 10 : spacing.sm,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: colors.text.dark,
    padding: 0,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  quickFilterContainer: {
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  quickFilterContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  quickFilterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: 'rgba(120, 120, 128, 0.12)',
    marginRight: spacing.xs,
  },
  quickFilterPillActive: {
    backgroundColor: colors.primary,
  },
  quickFilterText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.dark,
  },
  quickFilterTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
    zIndex: 1, // Ensure content stays below header
    marginTop: 320, // Push content below the fixed header
  },
  contentContainer: {
    paddingTop: 0, // No padding needed since we have margin-top
    // Prevent content from going under the header during scroll
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.35,
    color: colors.text.dark,
  },
  eventsCount: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.neutral.gray,
  },
  featuredList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.sm,
    width: width * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  featuredCardContent: {
    flex: 1,
  },
  featuredCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 4,
  },
  featuredCardSubtitle: {
    fontSize: 15,
    color: colors.neutral.gray,
  },
  myEventsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  myEventsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  myEventsContent: {
    flex: 1,
  },
  myEventsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 2,
  },
  myEventsCount: {
    fontSize: 15,
    color: colors.neutral.gray,
  },
  eventsList: {
    paddingHorizontal: spacing.md,
    // Container will provide the horizontal spacing
    gap: spacing.sm, // ADD: Consistent spacing between cards
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  emptyStateMessage: {
    fontSize: 17,
    color: colors.neutral.gray,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalCancel: {
    fontSize: 17,
    color: colors.primary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.dark,
  },
  modalClear: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.08,
    color: colors.neutral.gray,
    marginBottom: spacing.sm,
  },
  modalCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modalCategoryItem: {
    width: (width - spacing.md * 2 - spacing.sm * 2) / 3,
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  modalCategoryName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  modalFooter: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalApplyButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
});

