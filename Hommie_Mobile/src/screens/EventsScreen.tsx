import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EventCard from '../components/EventCard';
import {
  demoEvents,
  EventData,
  EventCategory,
  eventCategories,
  getUpcomingEvents,
  getFeaturedEvents,
  searchEvents,
  getEventsByCategory,
} from '../data/eventsData';
import { colors, spacing, typography, shadows } from '../constants';

const { width } = Dimensions.get('window');

type ViewMode = 'list' | 'calendar' | 'map';
type FilterTab = 'all' | 'today' | 'this_week' | 'my_events';

interface EventsScreenProps {
  navigation: any;
}

export default function EventsScreen({ navigation }: EventsScreenProps) {
  const [events, setEvents] = useState<EventData[]>(demoEvents);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>(demoEvents);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userEstate] = useState('Victoria Island Estate'); // This would come from user context
  const [userCity] = useState('Ikeja'); // This would come from user context

  useEffect(() => {
    applyFilters();
  }, [activeTab, searchQuery, selectedCategories, events]);

  const applyFilters = () => {
    let filtered = [...events];

    // Apply tab filter
    switch (activeTab) {
      case 'today':
        const today = new Date().toDateString();
        filtered = filtered.filter(event => new Date(event.date).toDateString() === today);
        break;
      case 'this_week':
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= new Date() && eventDate <= weekFromNow;
        });
        break;
      case 'my_events':
        filtered = filtered.filter(event => event.rsvpStatus === 'going' || event.organizer.id === 'current_user');
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchEvents(searchQuery).filter(event => 
        filtered.some(f => f.id === event.id)
      );
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => selectedCategories.includes(event.category));
    }

    setFilteredEvents(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const toggleCategoryFilter = (category: EventCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setActiveTab('all');
  };

  const getTabCount = (tab: FilterTab): number => {
    switch (tab) {
      case 'today':
        const today = new Date().toDateString();
        return events.filter(event => new Date(event.date).toDateString() === today).length;
      case 'this_week':
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return events.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= new Date() && eventDate <= weekFromNow;
        }).length;
      case 'my_events':
        return events.filter(event => event.rsvpStatus === 'going').length;
      default:
        return events.length;
    }
  };

  const renderTabButton = (tab: FilterTab, label: string) => {
    const isActive = activeTab === tab;
    const count = getTabCount(tab);
    
    return (
      <TouchableOpacity
        style={[styles.tabButton, isActive && styles.activeTabButton]}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[styles.tabBadge, isActive && styles.activeTabBadge]}>
            <Text style={[styles.tabBadgeText, isActive && styles.activeTabBadgeText]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFeaturedEvents = () => {
    const featured = getFeaturedEvents();
    if (featured.length === 0) return null;

    return (
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured Events in {userEstate}</Text>
        <FlatList
          data={featured}
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

  const renderCategoryFilters = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryFilters}
    >
      {eventCategories.map((category) => {
        const isSelected = selectedCategories.includes(category.id);
        return (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryFilter,
              { borderColor: category.color },
              isSelected && { backgroundColor: category.color }
            ]}
            onPress={() => toggleCategoryFilter(category.id)}
          >
            <MaterialCommunityIcons 
              name={category.icon as any} 
              size={16} 
              color={isSelected ? colors.white : category.color} 
            />
            <Text style={[
              styles.categoryFilterText,
              { color: isSelected ? colors.white : category.color }
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

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
          <TouchableOpacity 
            style={styles.viewModeButton}
            onPress={() => console.log('Toggle view mode')}
          >
            <MaterialCommunityIcons 
              name={viewMode === 'list' ? 'view-list' : viewMode === 'calendar' ? 'calendar' : 'map'} 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
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
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
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

        {/* Tab Navigation */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          {renderTabButton('all', 'All Events')}
          {renderTabButton('today', 'Today')}
          {renderTabButton('this_week', 'This Week')}
          {renderTabButton('my_events', 'My Events')}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Featured Events */}
        {activeTab === 'all' && renderFeaturedEvents()}

        {/* Category Filters */}
        {activeTab === 'all' && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            {renderCategoryFilters()}
          </View>
        )}

        {/* Events List */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'all' ? 'All Events' :
               activeTab === 'today' ? 'Today\'s Events' :
               activeTab === 'this_week' ? 'This Week\'s Events' :
               'My Events'}
            </Text>
            <Text style={styles.eventsCount}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {filteredEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-remove" size={64} color={colors.neutral.lightGray} />
              <Text style={styles.emptyStateTitle}>No Events Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 
                  'Try adjusting your search or filters' :
                  activeTab === 'my_events' ?
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
            <View style={styles.eventsList}>
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateEvent')}
        activeOpacity={0.8}
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
              {eventCategories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryGridItem,
                      isSelected && { backgroundColor: category.color }
                    ]}
                    onPress={() => toggleCategoryFilter(category.id)}
                  >
                    <MaterialCommunityIcons 
                      name={category.icon as any} 
                      size={24} 
                      color={isSelected ? colors.white : category.color} 
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
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.dark,
  },
  cityText: {
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
  },
  viewModeButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.neutral.lightGray,
  },
  title: {
    fontSize: typography.sizes['3xl'],
    fontWeight: '700',
    color: colors.text.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    marginBottom: spacing.lg,
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
    fontSize: typography.sizes.base,
    color: colors.text.dark,
    marginLeft: spacing.sm,
  },
  filterButton: {
    position: 'relative',
    padding: spacing.sm,
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.neutral.lightGray,
  },
  activeTabButton: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
    color: colors.neutral.gray,
  },
  activeTabButtonText: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.white,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  activeTabBadge: {
    backgroundColor: colors.neutral.offWhite,
  },
  tabBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  activeTabBadgeText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  featuredSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
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
  },
  categoryFilterText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
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
    fontSize: typography.sizes.sm,
    color: colors.neutral.gray,
    fontWeight: '500',
  },
  eventsList: {
    paddingBottom: spacing['3xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: '600',
    color: colors.text.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  clearFiltersButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '500',
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
    fontSize: typography.sizes.base,
    color: colors.neutral.gray,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.dark,
  },
  modalClearText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: spacing.md,
  },
  filterSectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
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
  },
  categoryGridText: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
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
  },
  applyFiltersText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
});
