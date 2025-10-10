# Events Redesign, Navigation Strategy & Help Feature Implementation Guide
## Following Apple Human Interface Guidelines

---

## Executive Summary

### Problems Identified

**1. Events Screen Issues:**
- ❌ Filter tabs (All Events, Today, This Week, My Events) look like they filter event **posts** in feed
- ❌ Category filters confusing - should they navigate to Events screen or filter feed?
- ❌ Unclear distinction between "Events in Feed" vs "Full Events Screen"
- ❌ No clear integration with FeedScreen's event filter

**2. Navigation Concerns:**
- ❌ Bottom navigation has 4 tabs (Home, Inbox, Market, More)
- ❌ Events is hidden in stack navigation (not prominent enough)
- ❌ Adding Events as 5th tab might be too many icons
- ❌ Need Apple-approved way to handle this

**3. Help/Errands Feature Needs Improvement:**
- ❌ Help feature exists but needs better design
- ❌ "I Can Help" button needs better flow
- ❌ Need dedicated Help Requests screen
- ❌ Better integration with notifications and responses

---

## Table of Contents

1. [Events Screen Redesign](#events-screen-redesign)
2. [Navigation Strategy (Apple's Way)](#navigation-strategy)
3. [Feed-Events Integration](#feed-events-integration)
4. [Help/Errands Feature Enhancement](#help-feature-implementation)

---

# PART 1: Events Screen Redesign

## Problem Analysis

### Current Issues

```
EVENTS SCREEN (EventsScreen.tsx):
┌─────────────────────────────┐
│ Victoria Island Estate      │ ← Location header
├─────────────────────────────┤
│ Community Events            │ ← Title
│ [Search bar] [Filter icon]  │
├─────────────────────────────┤
│ [All] [Today] [Week] [Mine] │ ← PROBLEM: Looks like feed filters
├─────────────────────────────┤
│ Featured Events...          │
├─────────────────────────────┤
│ Browse by Category          │ ← PROBLEM: Unclear purpose
│ [Social] [Sports] [Food]... │
├─────────────────────────────┤
│ All Events (24 events)      │
│ [Event cards...]            │
└─────────────────────────────┘

FEED SCREEN (FeedScreen.tsx):
┌─────────────────────────────┐
│ [All] [Help] [Events] [Alerts] ← Segment control
├─────────────────────────────┤
│ [Feed posts and event posts] │
└─────────────────────────────┘

CONFUSION:
- Clicking "Events" in Feed → Filters feed to show event posts
- But Categories in Events screen → Should they also filter?
- "All Events" tab → Is this like "All" in Feed?
- User doesn't know if they're seeing event POSTS or full EVENTS
```

### Apple's Solution: Clear Content Distinction

According to Apple HIG:
- **Different content types should have distinct views**
- **Navigation should be predictable and clear**
- **Filters should be contextual to the view**

---

## Solution: Redesigned Events Screen

### New Architecture

```
PURPOSE CLARITY:
- Feed Screen → Event POSTS (announcements, discussions about events)
- Events Screen → Full EVENT LISTINGS (with RSVP, tickets, details)

DESIGN CHANGES:
1. Remove confusing filter tabs (All, Today, Week, My Events)
2. Replace with Apple-style date selector
3. Make categories navigation aids (tap to see category-specific events)
4. Add clear view modes (List, Calendar, Map)
5. Better integration with Feed
```

---

## TASK BREAKDOWN: Events Screen Redesign

### Phase 1: Remove Confusing Filter Tabs

#### Task 1.1: Replace Tab Filters with Date Range Picker
**Priority**: High
**Estimated Time**: 2 hours
**File**: `Hommie_Mobile/src/screens/EventsScreen.tsx`

**Apple Design Principle**: **Clarity** - Date selection should feel like browsing a calendar, not filtering feed posts.

**Current Code** (Lines 320-331 - Tab Navigation):
```tsx
{/* Tab Navigation */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
  {renderTabButton('all', 'All Events')}
  {renderTabButton('today', 'Today')}
  {renderTabButton('this_week', 'This Week')}
  {renderTabButton('my_events', 'My Events')}
</ScrollView>
```

**New Design** (Apple Calendar-style picker):

```tsx
{/* Date Range Selector */}
<View style={styles.dateRangeContainer}>
  <TouchableOpacity
    style={styles.dateRangeButton}
    onPress={() => setShowDatePicker(true)}
  >
    <MaterialCommunityIcons name="calendar-range" size={20} color="#00A651" />
    <Text style={styles.dateRangeText}>{getDateRangeLabel()}</Text>
    <MaterialCommunityIcons name="chevron-down" size={20} color="#8E8E93" />
  </TouchableOpacity>
</View>

{/* Quick Date Filters (Subtle chips) */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters}>
  <TouchableOpacity
    style={[styles.quickFilterChip, selectedQuickFilter === 'upcoming' && styles.activeQuickFilter]}
    onPress={() => handleQuickFilter('upcoming')}
  >
    <Text style={[styles.quickFilterText, selectedQuickFilter === 'upcoming' && styles.activeQuickFilterText]}>
      Upcoming
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.quickFilterChip, selectedQuickFilter === 'this_weekend' && styles.activeQuickFilter]}
    onPress={() => handleQuickFilter('this_weekend')}
  >
    <Text style={[styles.quickFilterText, selectedQuickFilter === 'this_weekend' && styles.activeQuickFilterText]}>
      This Weekend
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.quickFilterChip, selectedQuickFilter === 'next_week' && styles.activeQuickFilter]}
    onPress={() => handleQuickFilter('next_week')}
  >
    <Text style={[styles.quickFilterText, selectedQuickFilter === 'next_week' && styles.activeQuickFilterText]}>
      Next Week
    </Text>
  </TouchableOpacity>
</ScrollView>
```

**Implementation Steps**:

1. **Remove Tab State**:
```tsx
// DELETE:
type FilterTab = 'all' | 'today' | 'this_week' | 'my_events';
const [activeTab, setActiveTab] = useState<FilterTab>('all');

// ADD:
type QuickFilter = 'upcoming' | 'this_weekend' | 'next_week' | 'custom';
const [selectedQuickFilter, setSelectedQuickFilter] = useState<QuickFilter>('upcoming');
const [dateRange, setDateRange] = useState({ from: new Date(), to: getWeekFromNow() });
const [showDatePicker, setShowDatePicker] = useState(false);
```

2. **Update fetchEvents Logic**:
```tsx
const fetchEvents = useCallback(async (filters: EventFilterDto = {}) => {
  try {
    setLoading(true);
    setError(null);

    // Use date range instead of tab logic
    const response = await EventsApi.getEvents({
      ...filters,
      dateFrom: dateRange.from.toISOString().split('T')[0],
      dateTo: dateRange.to.toISOString().split('T')[0],
    });

    setEvents(response.data);
  } catch (err) {
    const errorMessage = handleApiError(err);
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}, [dateRange]);
```

3. **Add Date Range Helper Functions**:
```tsx
const getDateRangeLabel = () => {
  const today = new Date();
  const isToday = isSameDay(dateRange.from, today);
  const isTomorrow = isSameDay(dateRange.from, getTomorrow());

  if (isToday && isSameDay(dateRange.to, today)) {
    return 'Today';
  } else if (isTomorrow) {
    return 'Tomorrow';
  } else if (selectedQuickFilter === 'this_weekend') {
    return 'This Weekend';
  } else if (selectedQuickFilter === 'next_week') {
    return 'Next Week';
  } else if (selectedQuickFilter === 'upcoming') {
    return 'Upcoming Events';
  } else {
    return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
  }
};

const handleQuickFilter = (filter: QuickFilter) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setSelectedQuickFilter(filter);

  const today = new Date();
  let from: Date, to: Date;

  switch (filter) {
    case 'upcoming':
      from = today;
      to = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
      break;
    case 'this_weekend':
      from = getNextSaturday();
      to = getNextSunday();
      break;
    case 'next_week':
      from = getStartOfNextWeek();
      to = getEndOfNextWeek();
      break;
    default:
      return;
  }

  setDateRange({ from, to });
};
```

4. **Add Styles**:
```tsx
dateRangeContainer: {
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: '#FFFFFF',
},
dateRangeButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F2F2F7',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 12,
  minHeight: 44,
},
dateRangeText: {
  flex: 1,
  fontSize: 15,
  fontWeight: '600',
  color: '#1C1C1E',
  marginLeft: 8,
  marginRight: 8,
},
quickFilters: {
  paddingHorizontal: 12,
  paddingBottom: 12,
},
quickFilterChip: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  marginHorizontal: 4,
  borderRadius: 20,
  backgroundColor: '#F2F2F7',
  minHeight: 36,
  justifyContent: 'center',
},
activeQuickFilter: {
  backgroundColor: '#00A651',
},
quickFilterText: {
  fontSize: 14,
  fontWeight: '500',
  color: '#8E8E93',
},
activeQuickFilterText: {
  color: '#FFFFFF',
},
```

**Acceptance Criteria**:
- ✅ Tab filters completely removed
- ✅ Date range picker button displays current range
- ✅ Quick filter chips work (Upcoming, This Weekend, Next Week)
- ✅ Tapping date range opens calendar modal (implement in next task)
- ✅ Events fetch based on date range
- ✅ Haptic feedback on filter changes
- ✅ Apple-style design (subtle, clear)

---

#### Task 1.2: Add "My Events" as Separate Section
**Priority**: High
**Estimated Time**: 1 hour
**File**: `Hommie_Mobile/src/screens/EventsScreen.tsx`

**Apple Design Principle**: **Separation of Concerns** - Personal content should be separate from browse content.

**Implementation**:

Instead of a filter tab, add "My Events" as a prominent card at the top:

```tsx
{/* After Featured Events section */}
{renderMyEventsCard()}

const renderMyEventsCard = () => {
  if (!myEventsCount || myEventsCount === 0) return null;

  return (
    <TouchableOpacity
      style={styles.myEventsCard}
      onPress={() => navigation.navigate('MyEventsScreen')}
      activeOpacity={0.7}
    >
      <View style={styles.myEventsHeader}>
        <MaterialCommunityIcons name="calendar-check" size={28} color="#00A651" />
        <View style={styles.myEventsContent}>
          <Text style={styles.myEventsTitle}>Your Events</Text>
          <Text style={styles.myEventsSubtitle}>
            {myEventsCount} upcoming event{myEventsCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
      </View>
    </TouchableOpacity>
  );
};
```

**Styles**:
```tsx
myEventsCard: {
  backgroundColor: '#E8F5E9',
  marginHorizontal: 16,
  marginBottom: 16,
  padding: 20,
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
  marginLeft: 16,
},
myEventsTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#1C1C1E',
  marginBottom: 2,
},
myEventsSubtitle: {
  fontSize: 14,
  color: '#00A651',
  fontWeight: '500',
},
```

**Create MyEventsScreen.tsx** (separate screen for user's events):
```tsx
// src/screens/MyEventsScreen.tsx
export default function MyEventsScreen() {
  const [selectedTab, setSelectedTab] = useState<'attending' | 'organized'>('attending');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Segmented Control */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, selectedTab === 'attending' && styles.activeSegment]}
          onPress={() => setSelectedTab('attending')}
        >
          <Text style={[styles.segmentText, selectedTab === 'attending' && styles.activeSegmentText]}>
            Attending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, selectedTab === 'organized' && styles.activeSegment]}
          onPress={() => setSelectedTab('organized')}
        >
          <Text style={[styles.segmentText, selectedTab === 'organized' && styles.activeSegmentText]}>
            Organized
          </Text>
        </TouchableOpacity>
      </View>

      {/* Events List based on selectedTab */}
      <ScrollView>
        {selectedTab === 'attending' ? (
          <AttendingEventsList />
        ) : (
          <OrganizedEventsList />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Acceptance Criteria**:
- ✅ "My Events" tab removed from main Events screen
- ✅ "My Events" card appears at top (if user has events)
- ✅ Card shows count of upcoming events
- ✅ Tapping card navigates to MyEventsScreen
- ✅ MyEventsScreen has Attending/Organized tabs
- ✅ Clear separation between browse and personal events

---

### Phase 2: Redesign Category Filters as Navigation

#### Task 2.1: Convert Categories to Navigation Cards
**Priority**: High
**Estimated Time**: 1.5 hours
**File**: `Hommie_Mobile/src/screens/EventsScreen.tsx`

**Apple Design Principle**: **Depth** - Categories are entry points to deeper content, not filters.

**Current Issue**:
```tsx
// Currently: Horizontal scrolling chips that filter
<ScrollView horizontal>
  {EVENT_CATEGORIES.map((category) => (
    <TouchableOpacity onPress={() => toggleCategoryFilter(category.id)}>
      <Text>{category.name}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

**New Design**: Grid of navigation cards (like iOS App Store categories):

```tsx
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
        onPress={() => navigation.navigate('EventCategories')}
      >
        <Text style={styles.seeAllCategoriesText}>See All Categories</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#00A651" />
      </TouchableOpacity>
    )}
  </View>
);

const handleCategoryNavigation = (category: EventCategory) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Navigate to category-specific event list
  navigation.navigate('CategoryEvents', {
    categoryId: category.id,
    categoryName: category.name,
    categoryColor: category.colorCode,
  });
};
```

**Styles**:
```tsx
categoriesSection: {
  marginBottom: 24,
  paddingHorizontal: 16,
},
sectionHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
sectionTitle: {
  fontSize: 22,
  fontWeight: '700',
  color: '#1C1C1E',
  letterSpacing: -0.4,
},
categoriesGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -6,
},
categoryCard: {
  width: '47%',
  margin: 6,
  padding: 16,
  borderRadius: 16,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E5EA',
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
  marginBottom: 12,
},
categoryName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1C1C1E',
  marginBottom: 4,
},
categoryCount: {
  fontSize: 13,
  color: '#8E8E93',
  marginBottom: 8,
},
categoryChevron: {
  position: 'absolute',
  bottom: 12,
  right: 12,
},
seeAllCategoriesButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  marginTop: 8,
},
seeAllCategoriesText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#00A651',
  marginRight: 4,
},
```

**Create CategoryEventsScreen.tsx**:
```tsx
// src/screens/CategoryEventsScreen.tsx
export default function CategoryEventsScreen({ route, navigation }) {
  const { categoryId, categoryName, categoryColor } = route.params;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryEvents();
  }, [categoryId]);

  const fetchCategoryEvents = async () => {
    try {
      setLoading(true);
      const response = await EventsApi.getEvents({ categoryId });
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching category events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with category color accent */}
      <View style={[styles.header, { borderBottomColor: categoryColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName} Events</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {loading ? (
          <LoadingEventCards />
        ) : events.length === 0 ? (
          <EmptyState
            title="No Events Yet"
            message={`No ${categoryName.toLowerCase()} events scheduled at the moment.`}
          />
        ) : (
          events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate('EventDetails', { eventId: event.id })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Acceptance Criteria**:
- ✅ Horizontal category chips removed
- ✅ Categories displayed as 2-column grid of cards
- ✅ Each card shows icon, name, and event count
- ✅ Tapping card navigates to CategoryEventsScreen
- ✅ CategoryEventsScreen shows all events in that category
- ✅ Clear visual hierarchy (cards look like navigation elements)
- ✅ Apple-style design (clean, spacious, tappable)

---

### Phase 3: Add View Mode Switcher

#### Task 3.1: Implement View Mode Toggle (List/Calendar/Map)
**Priority**: Medium
**Estimated Time**: 3 hours
**Files**: `EventsScreen.tsx`, create `EventsCalendarView.tsx`, `EventsMapView.tsx`

**Apple Design Principle**: **Flexibility** - Provide multiple ways to view same content.

**Current Code** (Lines 265-278 - View mode button):
```tsx
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
```

**New Design** (iOS-style segmented control):

```tsx
{/* View Mode Segmented Control */}
<View style={styles.viewModeContainer}>
  <View style={styles.viewModeControl}>
    <TouchableOpacity
      style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
      onPress={() => handleViewModeChange('list')}
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
    >
      <MaterialCommunityIcons
        name="map-marker"
        size={20}
        color={viewMode === 'map' ? '#FFFFFF' : '#8E8E93'}
      />
    </TouchableOpacity>
  </View>
</View>

const handleViewModeChange = (mode: ViewMode) => {
  Haptics.selectionAsync();
  setViewMode(mode);
};
```

**Render Content Based on View Mode**:
```tsx
{/* Render based on view mode */}
{viewMode === 'list' && (
  <EventsListView
    events={events}
    loading={loading}
    onEventPress={(event) => navigation.navigate('EventDetails', { eventId: event.id })}
  />
)}

{viewMode === 'calendar' && (
  <EventsCalendarView
    events={events}
    onDateSelect={(date) => handleDateSelect(date)}
    onEventPress={(event) => navigation.navigate('EventDetails', { eventId: event.id })}
  />
)}

{viewMode === 'map' && (
  <EventsMapView
    events={events}
    userLocation={userLocation}
    onEventPress={(event) => navigation.navigate('EventDetails', { eventId: event.id })}
  />
)}
```

**Styles**:
```tsx
viewModeContainer: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  alignItems: 'flex-end',
},
viewModeControl: {
  flexDirection: 'row',
  backgroundColor: '#F2F2F7',
  borderRadius: 10,
  padding: 2,
},
viewModeButton: {
  paddingHorizontal: 16,
  paddingVertical: 8,
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
```

**Create EventsCalendarView.tsx** (basic implementation):
```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

export default function EventsCalendarView({ events, onDateSelect, onEventPress }) {
  // Convert events to marked dates
  const markedDates = events.reduce((acc, event) => {
    const date = event.startDate.split('T')[0];
    acc[date] = {
      marked: true,
      dotColor: '#00A651',
      events: [...(acc[date]?.events || []), event],
    };
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => onDateSelect(new Date(day.dateString))}
        theme={{
          todayTextColor: '#00A651',
          selectedDayBackgroundColor: '#00A651',
          dotColor: '#00A651',
          arrowColor: '#00A651',
        }}
      />

      {/* Show events for selected date */}
      {/* Implementation details... */}
    </View>
  );
}
```

**Acceptance Criteria**:
- ✅ View mode segmented control visible
- ✅ Three modes: List, Calendar, Map
- ✅ List view shows event cards (default)
- ✅ Calendar view shows month calendar with event dots
- ✅ Map view shows events on map (can be basic MVP)
- ✅ Switching between views has haptic feedback
- ✅ Apple-style segmented control design
- ✅ Smooth transitions between views

---

# PART 2: Navigation Strategy (Apple's Way)

## Problem: Should Events Be in Tab Bar?

### Current Situation
```
CURRENT TAB BAR (4 tabs):
┌─────────────────────────────────┐
│ [Home] [Inbox] [Market] [More] │
└─────────────────────────────────┘

PROPOSED (5 tabs):
┌──────────────────────────────────────────┐
│ [Home] [Events] [Inbox] [Market] [More] │
└──────────────────────────────────────────┘
                ↑
         Add Events here?

CONCERN: 5 tabs might be too many
```

### Apple's Guidance on Tab Bars

From Apple HIG:
> **Use a tab bar to enable navigation to top-level destinations in your app that are meaningful and logically distinct from one another.**

> **In general, use a tab bar to provide navigation to **3-5** primary destinations.**

> **Avoid using more than 5 tabs.** Too many tabs can make it hard for people to locate their target tab.

---

## Apple's Solutions for This Scenario

### Solution 1: Keep 4 Tabs + Prominent Events Access (RECOMMENDED)

**Rationale**:
- Home tab serves as central hub
- Events can be accessed prominently from Home
- Keeps tab bar uncluttered
- Follows apps like Instagram (Feed, Search, Reels, Shop, Profile)

**Implementation**:

```tsx
// Keep current 4-tab structure
<Tab.Navigator>
  <Tab.Screen name="Home" />
  <Tab.Screen name="Inbox" />
  <Tab.Screen name="Market" />
  <Tab.Screen name="More" />
</Tab.Navigator>

// Make Events VERY prominent in Home screen
// Add floating Events button or banner
```

**In HomeScreen.tsx**, add prominent Events access:

```tsx
{/* After search bar */}
<TouchableOpacity
  style={styles.eventsBanner}
  onPress={() => navigation.navigate('Events')}
  activeOpacity={0.9}
>
  <View style={styles.eventsBannerContent}>
    <MaterialCommunityIcons name="calendar-star" size={32} color="#00A651" />
    <View style={styles.eventsBannerText}>
      <Text style={styles.eventsBannerTitle}>Community Events</Text>
      <Text style={styles.eventsBannerSubtitle}>
        {upcomingEventsCount} events happening soon
      </Text>
    </View>
  </View>
  <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
</TouchableOpacity>
```

**Styles** (Apple-style prominent banner):
```tsx
eventsBanner: {
  backgroundColor: '#E8F5E9',
  marginHorizontal: 16,
  marginVertical: 12,
  padding: 20,
  borderRadius: 16,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
},
eventsBannerContent: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
},
eventsBannerText: {
  flex: 1,
  marginLeft: 16,
},
eventsBannerTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#1C1C1E',
  marginBottom: 4,
},
eventsBannerSubtitle: {
  fontSize: 14,
  color: '#00A651',
  fontWeight: '500',
},
```

---

### Solution 2: Use 5 Tabs (If Events Are Core)

**When to Use**: If events are THE most important feature of your app (like Calendar app).

**Implementation**:

```tsx
<Tab.Navigator>
  <Tab.Screen name="Home" component={HomeScreen} />
  <Tab.Screen name="Events" component={EventsScreen} /> {/* NEW */}
  <Tab.Screen name="Inbox" component={InboxScreen} />
  <Tab.Screen name="Market" component={MarketplaceNavigator} />
  <Tab.Screen name="More" component={MoreScreen} />
</Tab.Navigator>
```

**Apple Design Guidelines for 5 Tabs**:
- ✅ Keep tab labels SHORT (1 word if possible)
- ✅ Use clear, recognizable icons
- ✅ Center tab can be elevated/special (like Instagram's + button)
- ✅ Ensure each tab has distinct, meaningful purpose

**Pros**:
- ✅ Events always visible and accessible
- ✅ One tap to reach Events
- ✅ Clear hierarchy

**Cons**:
- ❌ Slightly cluttered tab bar
- ❌ Takes space from other features
- ❌ Less room for future features

---

### Solution 3: Merge Market + More (Least Recommended)

**Implementation**:

```tsx
<Tab.Navigator>
  <Tab.Screen name="Home" />
  <Tab.Screen name="Events" /> {/* NEW */}
  <Tab.Screen name="Inbox" />
  <Tab.Screen name="Browse" /> {/* Combines Market + More */}
</Tab.Navigator>
```

**Cons**:
- ❌ Loses clear Marketplace identity
- ❌ Confusing purpose for "Browse" tab
- ❌ Not Apple-like (unclear navigation)

---

## RECOMMENDED SOLUTION

### Implement Solution 1: Keep 4 Tabs + Prominent Events Access

**Task Breakdown**:

#### Task 2.1: Add Events Banner to Home Screen
**Priority**: High
**Estimated Time**: 1 hour
**File**: `Hommie_Mobile/src/screens/HomeScreen.tsx`

**Implementation Steps**:

1. **Add Events Count State**:
```tsx
const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);

useEffect(() => {
  fetchUpcomingEventsCount();
}, []);

const fetchUpcomingEventsCount = async () => {
  try {
    const response = await EventsApi.getUpcomingEventsCount();
    setUpcomingEventsCount(response.count);
  } catch (error) {
    console.error('Error fetching events count:', error);
  }
};
```

2. **Add Events Banner** (after search bar, before feed):
```tsx
<TouchableOpacity
  style={styles.eventsBanner}
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Events');
  }}
  activeOpacity={0.9}
>
  <View style={styles.eventsBannerContent}>
    <View style={styles.eventsBannerIcon}>
      <MaterialCommunityIcons name="calendar-star" size={28} color="#00A651" />
    </View>
    <View style={styles.eventsBannerText}>
      <Text style={styles.eventsBannerTitle}>Community Events</Text>
      <Text style={styles.eventsBannerSubtitle}>
        {upcomingEventsCount > 0
          ? `${upcomingEventsCount} event${upcomingEventsCount !== 1 ? 's' : ''} happening soon`
          : 'Discover events in your community'
        }
      </Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
  </View>
</TouchableOpacity>
```

3. **Add Styles** (Apple-style prominent element):
```tsx
eventsBanner: {
  backgroundColor: '#E8F5E9',
  marginHorizontal: 16,
  marginTop: 8,
  marginBottom: 16,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
  overflow: 'hidden',
},
eventsBannerContent: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 20,
},
eventsBannerIcon: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 16,
},
eventsBannerText: {
  flex: 1,
},
eventsBannerTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#1C1C1E',
  marginBottom: 4,
  letterSpacing: -0.4,
},
eventsBannerSubtitle: {
  fontSize: 14,
  color: '#00A651',
  fontWeight: '500',
},
```

**Acceptance Criteria**:
- ✅ Events banner appears prominently on Home screen
- ✅ Shows count of upcoming events
- ✅ Tapping banner navigates to Events screen
- ✅ Haptic feedback on tap
- ✅ Apple-style design (clean, prominent, inviting)
- ✅ Updates count when events change

---

#### Task 2.2: Add Events to Home Sidebar (Quick Access)
**Priority**: Medium
**Estimated Time**: 15 minutes
**File**: `Hommie_Mobile/src/screens/HomeScreen.tsx`

**Add to sidebar menu**:
```tsx
<TouchableOpacity
  style={styles.menuItem}
  onPress={() => handleMenuItemPress(() => navigation.navigate('Events'))}
>
  <MaterialCommunityIcons name="calendar" size={24} color="#7B68EE" />
  <Text style={styles.menuItemText}>Events</Text>
  {upcomingEventsCount > 0 && (
    <View style={styles.menuBadge}>
      <Text style={styles.menuBadgeText}>{upcomingEventsCount}</Text>
    </View>
  )}
  <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
</TouchableOpacity>
```

**Acceptance Criteria**:
- ✅ Events in sidebar menu
- ✅ Badge shows count if there are upcoming events
- ✅ Tapping navigates to Events screen

---

# PART 3: Feed-Events Integration

## Problem: Event Posts vs Event Listings

### Current Confusion

```
FEED SCREEN:
User taps "Events" segment
↓
Shows EVENT POSTS (discussions about events)

EVENTS SCREEN:
User opens Events screen
↓
Shows FULL EVENT LISTINGS (with RSVP, details)

CONFUSION: What's the difference?
```

---

## Solution: Clear Content Types

### Define Content Types

**Event Post** (Feed content):
- Discussion or announcement ABOUT an event
- Can be created by anyone
- Shows in Feed when "Events" segment selected
- Links to full event listing

**Event Listing** (Events screen content):
- Full event with RSVP, tickets, attendees
- Official event page
- Only on Events screen
- Can have multiple posts discussing it

---

## Implementation

### Task 3.1: Update Feed Event Posts to Link to Events Screen
**Priority**: High
**Estimated Time**: 1 hour
**File**: `Hommie_Mobile/src/components/UnifiedFeedList.tsx`

**Current**: Event posts just show event info in feed

**New**: Event posts have prominent "View Event Details" button

```tsx
// In EventPostCard component
<View style={styles.eventPostCard}>
  {/* Event post content */}
  <Text style={styles.eventPostText}>{post.content}</Text>

  {/* Event preview */}
  {post.relatedEventId && (
    <View style={styles.eventPreview}>
      <View style={styles.eventPreviewHeader}>
        <MaterialCommunityIcons name="calendar" size={20} color="#00A651" />
        <Text style={styles.eventPreviewLabel}>Event</Text>
      </View>

      <Text style={styles.eventPreviewTitle}>{post.relatedEventTitle}</Text>
      <Text style={styles.eventPreviewDate}>{formatEventDate(post.relatedEventDate)}</Text>

      {/* Call to action */}
      <TouchableOpacity
        style={styles.viewEventButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('EventDetails', { eventId: post.relatedEventId });
        }}
      >
        <Text style={styles.viewEventButtonText}>View Event Details</Text>
        <MaterialCommunityIcons name="arrow-right" size={18} color="#00A651" />
      </TouchableOpacity>
    </View>
  )}
</View>
```

**Styles**:
```tsx
eventPreview: {
  backgroundColor: '#F9F9F9',
  padding: 16,
  borderRadius: 12,
  marginTop: 12,
  borderLeftWidth: 3,
  borderLeftColor: '#00A651',
},
eventPreviewHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
eventPreviewLabel: {
  fontSize: 12,
  fontWeight: '600',
  color: '#00A651',
  marginLeft: 4,
  textTransform: 'uppercase',
},
eventPreviewTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1C1C1E',
  marginBottom: 4,
},
eventPreviewDate: {
  fontSize: 14,
  color: '#8E8E93',
  marginBottom: 12,
},
viewEventButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#E8F5E9',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
},
viewEventButtonText: {
  fontSize: 15,
  fontWeight: '600',
  color: '#00A651',
  marginRight: 4,
},
```

**Acceptance Criteria**:
- ✅ Event posts show event preview card
- ✅ Preview shows event title, date, and venue
- ✅ "View Event Details" button navigates to EventDetails screen
- ✅ Clear distinction between post content and event info
- ✅ Haptic feedback on button tap

---

### Task 3.2: Add "Share to Feed" Option in Events Screen
**Priority**: Medium
**Estimated Time**: 1 hour
**File**: `Hommie_Mobile/src/screens/EventDetailsScreen.tsx`

**Implementation**:

Add share button in EventDetails that creates event post:

```tsx
<TouchableOpacity
  style={styles.shareToFeedButton}
  onPress={handleShareToFeed}
>
  <MaterialCommunityIcons name="share-variant" size={20} color="#00A651" />
  <Text style={styles.shareToFeedText}>Share to Feed</Text>
</TouchableOpacity>

const handleShareToFeed = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  navigation.navigate('CreatePost', {
    postType: 'event',
    relatedEventId: event.id,
    relatedEventTitle: event.title,
    relatedEventDate: event.startDate,
    prefillContent: `Check out this event! 🎉`,
  });
};
```

**Acceptance Criteria**:
- ✅ Share button in Event Details screen
- ✅ Creates event post with event linked
- ✅ User can add their own message
- ✅ Post appears in feed with event preview

---
