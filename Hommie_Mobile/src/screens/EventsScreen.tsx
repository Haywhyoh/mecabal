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
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EventCard from '../components/EventCard';
import EventCardSkeleton from '../components/EventCardSkeleton';
import ErrorView from '../components/ErrorView';
import EventsCalendarView from '../components/EventsCalendarView';
import EventsMapView from '../components/EventsMapView';
import { EventsApi, handleApiError, EVENT_CATEGORIES } from '../services/EventsApi';
import type { Event, EventFilterDto } from '../services/EventsApi';
import { colors, spacing, typography, shadows } from '../constants';

const { width } = Dimensions.get('window');

type ViewMode = 'list' | 'calendar' | 'map';
type QuickFilter = 'upcoming' | 'this_weekend' | 'this_month' | 'my_events';

interface EventsScreenProps {
  navigation: any;
}

export default function EventsScreen({ navigation }: EventsScreenProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [categoryEventCounts, setCategoryEventCounts] = useState<Record<number, number>>({});
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
  const [userEstate] = useState('Victoria Island Estate'); // This would come from user context
  const [userCity] = useState('Ikeja'); // This would come from user context

  // Fetch events from API
  const fetchEvents = useCallback(async (filters: EventFilterDto = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      const baseFilters = { ...filters };
      
      // Apply date range filters
      if (dateRange.start && dateRange.end) {
        baseFilters.dateFrom = dateRange.start.toISOString().split('T')[0];
        baseFilters.dateTo = dateRange.end.toISOString().split('T')[0];
      } else {
        // Apply quick filter logic
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

  // Fetch featured events
  const fetchFeaturedEvents = useCallback(async () => {
    try {
      const featured = await EventsApi.getFeaturedEvents(5);
      setFeaturedEvents(featured || []);
    } catch (err) {
      console.error('Error fetching featured events:', err);
      setFeaturedEvents([]); // Set to empty array on error
    }
  }, []);

  // Fetch my events
  const fetchMyEvents = useCallback(async () => {
    try {
      const myEventsResponse = await EventsApi.getMyEvents('all', {});
      setMyEvents(myEventsResponse.data || []);
    } catch (err) {
      console.error('Error fetching my events:', err);
      setMyEvents([]); // Set to empty array on error
    }
  }, []);

  // Fetch category event counts
  const fetchCategoryEventCounts = useCallback(async () => {
    try {
      const counts: Record<number, number> = {};
      await Promise.all(
        EVENT_CATEGORIES.map(async (category) => {
          try {
            const response = await EventsApi.getEvents({ categoryId: category.id });
            counts[category.id] = response.data?.length || 0;
          } catch (err) {
            console.error(`Error fetching count for category ${category.id}:`, err);
            counts[category.id] = 0;
          }
        })
      );
      setCategoryEventCounts(counts);
    } catch (err) {
      console.error('Error fetching category event counts:', err);
    }
  }, []);

  // Debounced search effect
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

  // Category filter effect
  useEffect(() => {
    if (selectedCategories.length > 0) {
      fetchEvents({ categoryId: selectedCategories[0] });
    } else {
      fetchEvents();
    }
  }, [selectedCategories, fetchEvents]);

  // Initial load
  useEffect(() => {
    fetchEvents();
    fetchFeaturedEvents();
    fetchMyEvents();
    fetchCategoryEventCounts();
  }, [fetchEvents, fetchFeaturedEvents, fetchMyEvents, fetchCategoryEventCounts]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.all([
        fetchEvents(),
        fetchFeaturedEvents(),
        fetchMyEvents(),
        fetchCategoryEventCounts()
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
        : [categoryId] // Only allow one category selection for now
    );
  };

  const clearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategories([]);
    setSearchQuery('');
    setSelectedQuickFilter('upcoming');
    setDateRange({ start: null, end: null });
  };

  // Date range picker helper functions
  const getDateRangeLabel = () => {
    if (dateRange.start && dateRange.end) {
      const startStr = dateRange.start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      const endStr = dateRange.end.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return `${startStr} - ${endStr}`;
    }
    
    switch (selectedQuickFilter) {
      case 'upcoming':
        return 'Upcoming Events';
      case 'this_weekend':
        return 'This Weekend';
      case 'this_month':
        return 'This Month';
      case 'my_events':
        return 'My Events';
      default:
        return 'Select Date Range';
    }
  };

  const handleQuickFilter = (filter: QuickFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedQuickFilter(filter);
    setDateRange({ start: null, end: null }); // Clear custom date range
  };

  const handleDateRangeSelect = (start: Date, end: Date) => {
    setDateRange({ start, end });
    setSelectedQuickFilter('upcoming'); // Reset to upcoming when custom range is selected
    setShowDatePicker(false);
  };

  // Category navigation helper functions
  const getCategoryEventCount = (categoryId: number): number => {
    return categoryEventCounts[categoryId] || 0;
  };

  const handleCategoryNavigation = (category: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to CategoryEventsScreen
    navigation.navigate('CategoryEvents', {
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.colorCode,
    });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    Haptics.selectionAsync();
    setViewMode(mode);
  };

  const handleDateSelect = (date: Date) => {
    // For now, we'll just log the selected date
    // In a real app, this could filter events by the selected date
    console.log('Selected date:', date);
  };

  const handleEventPress = (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('EventDetails', { eventId: event.id });
  };


  const renderFeaturedEvents = () => {
    if (!featuredEvents || featuredEvents.length === 0) return null;

    return (
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured Events in {userEstate}</Text>
        <FlatList
          data={featuredEvents}
          renderItem={({ item }) => (
            <EventCard 
              event={item} 
              variant="featured"
              onPress={() => navigation.navigate('EventDetails', { eventId: item.id })} 
            />
          )}
          keyExtractor={(item) => `featured_${item.id}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      </View>
    );
  };

  const renderCategoryNavigation = () => (
    <View style={styles.categoriesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Browse by Interest</Text>
      </View>

      <View style={styles.categoriesGrid}>
        {EVENT_CATEGORIES.slice(0, 6).map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              { borderColor: category.colorCode }
            ]}
            onPress={() => handleCategoryNavigation(category)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityLabel={`${category.name}, ${getCategoryEventCount(category.id)} events`}
            accessibilityHint="Tap to view events in this category"
            accessibilityRole="button"
          >
            <View style={[styles.categoryIcon, { backgroundColor: category.colorCode + '20' }]}>
              <MaterialCommunityIcons
                name={category.icon as any}
                size={28}
                color={category.colorCode}
              />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryCount}>
              {getCategoryEventCount(category.id)} events
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color="#8E8E93"
              style={styles.categoryChevron}
            />
          </TouchableOpacity>
        ))}
      </View>

      {EVENT_CATEGORIES.length > 6 && (
        <TouchableOpacity
          style={styles.seeAllCategoriesButton}
          onPress={() => {
            // For now, we'll show all categories
            // In a real app, this would navigate to EventCategoriesScreen
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          accessible={true}
          accessibilityLabel="See all categories"
          accessibilityHint="Tap to view all event categories"
          accessibilityRole="button"
        >
          <Text style={styles.seeAllCategoriesText}>See All Categories</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#00A651" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMyEventsCard = () => {
    if (!myEvents || myEvents.length === 0) return null;

    return (
      <TouchableOpacity
        style={styles.myEventsCard}
        onPress={() => {
          // Navigate to MyEventsScreen or show my events
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // For now, we'll filter to show my events
          setSelectedQuickFilter('my_events');
        }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={`Your events, ${myEvents.length} upcoming event${myEvents.length !== 1 ? 's' : ''}`}
        accessibilityHint="Tap to view your events"
        accessibilityRole="button"
      >
        <View style={styles.myEventsHeader}>
          <MaterialCommunityIcons name="calendar-check" size={28} color="#00A651" />
          <View style={styles.myEventsContent}>
            <Text style={styles.myEventsTitle}>Your Events</Text>
            <Text style={styles.myEventsSubtitle}>
              {myEvents.length} upcoming event{myEvents.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
            <View style={styles.locationText}>
              <Text style={styles.estateText}>{userEstate}</Text>
              <Text style={styles.cityText}>{userCity}, Lagos</Text>
            </View>
          </View>
          {/* View Mode Segmented Control */}
          <View style={styles.viewModeContainer}>
            <View style={styles.viewModeControl}>
              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
                onPress={() => handleViewModeChange('list')}
                accessible={true}
                accessibilityLabel="List view"
                accessibilityHint="Switch to list view mode"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="view-list"
                  size={20}
                  color={viewMode === 'list' ? '#FFFFFF' : '#8E8E93'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'calendar' && styles.activeViewMode]}
                onPress={() => handleViewModeChange('calendar')}
                accessible={true}
                accessibilityLabel="Calendar view"
                accessibilityHint="Switch to calendar view mode"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={20}
                  color={viewMode === 'calendar' ? '#FFFFFF' : '#8E8E93'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewModeButton, viewMode === 'map' && styles.activeViewMode]}
                onPress={() => handleViewModeChange('map')}
                accessible={true}
                accessibilityLabel="Map view"
                accessibilityHint="Switch to map view mode"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons
                  name="map-marker"
                  size={20}
                  color={viewMode === 'map' ? '#FFFFFF' : '#8E8E93'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <Text style={styles.title}>Community Events</Text>
        <Text style={styles.subtitle}>Discover and join events in your neighborhood</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.neutral.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events, organizers, or locations..."
            placeholderTextColor={colors.neutral.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            allowFontScaling={true}
            accessible={true}
            accessibilityLabel="Search events"
            accessibilityHint="Search for events by title, organizer, or location"
            accessibilityRole="search"
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
            accessible={true}
            accessibilityLabel={`Filter events${selectedCategories.length > 0 ? `, ${selectedCategories.length} filter applied` : ''}`}
            accessibilityHint="Open filter options to refine event search"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons 
              name="filter-variant" 
              size={20} 
              color={selectedCategories.length > 0 ? colors.primary : colors.neutral.gray} 
            />
            {selectedCategories.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{selectedCategories.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Range Selector */}
        <View style={styles.dateRangeContainer}>
          <TouchableOpacity
            style={styles.dateRangeButton}
            onPress={() => setShowDatePicker(true)}
            accessible={true}
            accessibilityLabel="Select date range"
            accessibilityHint="Tap to open date picker"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="calendar-range" size={20} color="#00A651" />
            <Text style={styles.dateRangeText}>{getDateRangeLabel()}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Quick Date Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.quickFilters}
          contentContainerStyle={styles.quickFiltersContent}
        >
          <TouchableOpacity
            style={[styles.quickFilterChip, selectedQuickFilter === 'upcoming' && styles.activeQuickFilter]}
            onPress={() => handleQuickFilter('upcoming')}
            accessible={true}
            accessibilityLabel="Upcoming events"
            accessibilityRole="button"
            accessibilityState={{ selected: selectedQuickFilter === 'upcoming' }}
          >
            <Text style={[styles.quickFilterText, selectedQuickFilter === 'upcoming' && styles.activeQuickFilterText]}>
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterChip, selectedQuickFilter === 'this_weekend' && styles.activeQuickFilter]}
            onPress={() => handleQuickFilter('this_weekend')}
            accessible={true}
            accessibilityLabel="This weekend events"
            accessibilityRole="button"
            accessibilityState={{ selected: selectedQuickFilter === 'this_weekend' }}
          >
            <Text style={[styles.quickFilterText, selectedQuickFilter === 'this_weekend' && styles.activeQuickFilterText]}>
              This Weekend
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterChip, selectedQuickFilter === 'this_month' && styles.activeQuickFilter]}
            onPress={() => handleQuickFilter('this_month')}
            accessible={true}
            accessibilityLabel="This month events"
            accessibilityRole="button"
            accessibilityState={{ selected: selectedQuickFilter === 'this_month' }}
          >
            <Text style={[styles.quickFilterText, selectedQuickFilter === 'this_month' && styles.activeQuickFilterText]}>
              This Month
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickFilterChip, selectedQuickFilter === 'my_events' && styles.activeQuickFilter]}
            onPress={() => handleQuickFilter('my_events')}
            accessible={true}
            accessibilityLabel="My events"
            accessibilityRole="button"
            accessibilityState={{ selected: selectedQuickFilter === 'my_events' }}
          >
            <Text style={[styles.quickFilterText, selectedQuickFilter === 'my_events' && styles.activeQuickFilterText]}>
              My Events
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Featured Events */}
        {selectedQuickFilter !== 'my_events' && renderFeaturedEvents()}

        {/* My Events Card */}
        {selectedQuickFilter !== 'my_events' && renderMyEventsCard()}

        {/* Category Navigation */}
        {selectedQuickFilter !== 'my_events' && renderCategoryNavigation()}

        {/* Events Content Based on View Mode */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedQuickFilter === 'upcoming' ? 'Upcoming Events' :
               selectedQuickFilter === 'this_weekend' ? 'This Weekend\'s Events' :
               selectedQuickFilter === 'this_month' ? 'This Month\'s Events' :
               selectedQuickFilter === 'my_events' ? 'My Events' :
               'Events'}
            </Text>
            <Text style={styles.eventsCount}>
              {events.length} event{events.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {/* Render based on view mode */}
          {viewMode === 'list' && (
            <View style={styles.eventsList}>
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((index) => (
                    <EventCardSkeleton key={index} />
                  ))}
                </>
              ) : error ? (
                <ErrorView 
                  error={error} 
                  onRetry={() => fetchEvents()} 
                />
              ) : events.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="calendar-remove" size={64} color={colors.neutral.lightGray} />
                  <Text style={styles.emptyStateTitle}>No Events Found</Text>
                  <Text style={styles.emptyStateText}>
                    {searchQuery ? 
                      'Try adjusting your search or filters' :
                      selectedQuickFilter === 'my_events' ?
                      'You haven\'t RSVP\'d to any events yet' :
                      'No events scheduled for this period'}
                  </Text>
                  {(searchQuery || selectedCategories.length > 0) && (
                    <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                      <Text style={styles.clearFiltersText}>Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => handleEventPress(event)}
                  />
                ))
              )}
            </View>
          )}

          {viewMode === 'calendar' && (
            <EventsCalendarView
              events={events}
              onDateSelect={handleDateSelect}
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
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('CreateEvent');
        }}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel="Create new event"
        accessibilityHint="Tap to create a new community event"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Events</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.modalClearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
            <View style={styles.categoryGrid}>
              {EVENT_CATEGORIES.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryGridItem,
                      isSelected && { backgroundColor: category.colorCode }
                    ]}
                    onPress={() => toggleCategoryFilter(category.id)}
                  >
                    <MaterialCommunityIcons 
                      name={category.icon as any} 
                      size={24} 
                      color={isSelected ? colors.white : category.colorCode} 
                    />
                    <Text style={[
                      styles.categoryGridText,
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
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFiltersText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Date Range</Text>
            <TouchableOpacity onPress={() => {
              setDateRange({ start: null, end: null });
              setShowDatePicker(false);
            }}>
              <Text style={styles.modalClearText}>Clear</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.datePickerContent}>
            <Text style={styles.datePickerDescription}>
              Choose a date range to filter events
            </Text>
            
            {/* Custom Date Range Inputs */}
            <View style={styles.dateInputContainer}>
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateInputLabel}>From</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    // For now, we'll use a simple approach
                    // In a real app, you'd use a proper date picker library
                    Alert.alert('Date Picker', 'Date picker implementation would go here');
                  }}
                >
                  <Text style={styles.dateInputText}>
                    {dateRange.start ? dateRange.start.toLocaleDateString() : 'Select start date'}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateInputLabel}>To</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => {
                    // For now, we'll use a simple approach
                    // In a real app, you'd use a proper date picker library
                    Alert.alert('Date Picker', 'Date picker implementation would go here');
                  }}
                >
                  <Text style={styles.dateInputText}>
                    {dateRange.end ? dateRange.end.toLocaleDateString() : 'Select end date'}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Date Range Presets */}
            <View style={styles.datePresetsContainer}>
              <Text style={styles.datePresetsTitle}>Quick Select</Text>
              <View style={styles.datePresetsGrid}>
                <TouchableOpacity
                  style={styles.datePresetButton}
                  onPress={() => {
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleDateRangeSelect(today, tomorrow);
                  }}
                >
                  <Text style={styles.datePresetText}>Today</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.datePresetButton}
                  onPress={() => {
                    const today = new Date();
                    const nextWeek = new Date(today);
                    nextWeek.setDate(nextWeek.getDate() + 7);
                    handleDateRangeSelect(today, nextWeek);
                  }}
                >
                  <Text style={styles.datePresetText}>Next 7 Days</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.datePresetButton}
                  onPress={() => {
                    const today = new Date();
                    const nextMonth = new Date(today);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    handleDateRangeSelect(today, nextMonth);
                  }}
                >
                  <Text style={styles.datePresetText}>Next 30 Days</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.datePresetButton}
                  onPress={() => {
                    const today = new Date();
                    const nextYear = new Date(today);
                    nextYear.setFullYear(nextYear.getFullYear() + 1);
                    handleDateRangeSelect(today, nextYear);
                  }}
                >
                  <Text style={styles.datePresetText}>Next Year</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.applyFiltersButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.applyFiltersText}>Apply Date Range</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.offWhite,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    ...shadows.small,
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: spacing.sm,
  },
  estateText: {
    fontSize: typography.sizes.headline,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.headline,
    color: colors.text.dark,
  },
  cityText: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.subhead,
    color: colors.neutral.gray,
  },
  // View Mode Segmented Control Styles
  viewModeContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-end',
  },
  viewModeControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeViewMode: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: typography.sizes.largeTitle,
    fontWeight: typography.weights.bold,
    lineHeight: typography.lineHeights.largeTitle,
    color: colors.text.dark,
    marginBottom: 4,
    allowFontScaling: true,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.gray,
    marginBottom: spacing.lg,
    allowFontScaling: true,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.lightGray,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.text.dark,
    marginLeft: spacing.sm,
  },
  filterButton: {
    position: 'relative',
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  featuredSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  featuredList: {
    paddingLeft: spacing.md,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryFilters: {
    paddingHorizontal: spacing.md,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: colors.white,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  categoryFilterText: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.subhead,
    marginLeft: spacing.xs,
  },
  eventsSection: {
    flex: 1,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  eventsCount: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.subhead,
    color: colors.neutral.gray,
  },
  eventsList: {
    paddingBottom: spacing['3xl'],
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.gray,
    marginTop: spacing.md,
  },
  errorState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.body,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.gray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  clearFiltersButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFiltersText: {
    color: colors.white,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.body,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
    elevation: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightGray,
  },
  modalCancelText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.regular,
    lineHeight: typography.lineHeights.body,
    color: colors.neutral.gray,
  },
  modalTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
  },
  modalClearText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.body,
    color: colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  filterSectionTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.title3,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryGridItem: {
    width: (width - spacing.md * 2 - spacing.xs * 4) / 2,
    margin: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    alignItems: 'center',
    backgroundColor: colors.white,
    minHeight: 44,
    justifyContent: 'center',
  },
  categoryGridText: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.medium,
    lineHeight: typography.lineHeights.subhead,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightGray,
  },
  applyFiltersButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  applyFiltersText: {
    color: colors.white,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
  // New Date Range Picker Styles
  dateRangeContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    minHeight: 48,
  },
  dateRangeText: {
    flex: 1,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
    marginHorizontal: spacing.sm,
    textAlign: 'center',
  },
  quickFilters: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  quickFiltersContent: {
    paddingRight: spacing.md,
  },
  quickFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.neutral.lightGray,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeQuickFilter: {
    backgroundColor: colors.primary,
  },
  quickFilterText: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.medium,
    color: colors.text.secondary,
  },
  activeQuickFilterText: {
    color: colors.white,
  },
  // Date Picker Modal Styles
  datePickerContent: {
    flex: 1,
    padding: spacing.md,
  },
  datePickerDescription: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeights.body,
  },
  dateInputContainer: {
    marginBottom: spacing.xl,
  },
  dateInputWrapper: {
    marginBottom: spacing.md,
  },
  dateInputLabel: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    minHeight: 48,
  },
  dateInputText: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.text.dark,
  },
  datePresetsContainer: {
    marginTop: spacing.lg,
  },
  datePresetsTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  datePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  datePresetButton: {
    width: (width - spacing.md * 2 - spacing.xs * 4) / 2,
    margin: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  datePresetText: {
    fontSize: typography.sizes.subhead,
    fontWeight: typography.weights.medium,
    color: colors.text.dark,
    textAlign: 'center',
  },
  // My Events Card Styles
  myEventsCard: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  myEventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  myEventsContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  myEventsTitle: {
    fontSize: typography.sizes.title3,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  myEventsSubtitle: {
    fontSize: typography.sizes.subhead,
    color: '#00A651',
    fontWeight: typography.weights.medium,
  },
  // Category Navigation Styles
  categoriesSection: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  categoryCard: {
    width: '47%',
    margin: spacing.xs,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    minHeight: 120,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  categoryCount: {
    fontSize: typography.sizes.caption1,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  categoryChevron: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  seeAllCategoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  seeAllCategoriesText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginRight: spacing.xs,
  },
});
