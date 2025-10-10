# PART 4: Help/Errands Feature Enhancement
## Community Assistance & Neighbor-to-Neighbor Errands

---

## Problem Analysis

### Current State

The Help feature already exists in the app:
- ✅ Users can create Help posts (errands, jobs, recommendations, advice)
- ✅ HelpPostCard component displays help requests with:
  - Help category (job, errand, recommendation, advice)
  - Budget (if applicable)
  - Deadline
  - Urgency level (high, medium, low)
  - "I Can Help" button
- ✅ Feed has "Help" segment filter

### Issues to Address

**1. Limited Functionality:**
- ❌ "I Can Help" button doesn't have clear follow-up flow
- ❌ No dedicated Help Requests screen (browse all help requests)
- ❌ No way to see who offered to help
- ❌ No response management system
- ❌ No tracking of help offered vs help received

**2. Discovery Problems:**
- ❌ Help posts only visible in Feed
- ❌ No way to browse by category (errands, jobs, etc.)
- ❌ No urgency-based sorting
- ❌ Can't filter by location/distance

**3. Trust & Safety:**
- ❌ No verification of helpers
- ❌ No rating system for completed help
- ❌ No payment/escrow for paid errands
- ❌ Limited safety guidelines

---

## Apple's Approach to Marketplace/Task Features

From Apple HIG examples (TaskRabbit, Thumbtack, Nextdoor):
> **Make it easy to browse, request, and offer services within a trusted community.**

Key Principles:
1. **Clear Categories** - Organized by service type
2. **Trust Signals** - Verification badges, ratings, reviews
3. **Smooth Transactions** - Simple request → offer → complete flow
4. **Safety First** - Guidelines, reporting, secure payments

---

## Solution: Enhanced Help/Errands System

### New Architecture

```
BEFORE:
Feed → Help segment → Help posts → "I Can Help" → ???

AFTER:
┌─────────────────────────────────────┐
│  Multiple Entry Points              │
├─────────────────────────────────────┤
│ 1. Feed → Help segment (quick view) │
│ 2. Home → Help Requests card        │
│ 3. More → Community Help            │
│ 4. Notifications → Help offers      │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Help Requests Screen               │
│  - Browse all help requests         │
│  - Filter by category/urgency       │
│  - Sort by distance/time            │
│  - "Post Request" FAB               │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Help Request Detail                │
│  - Full request details             │
│  - Map showing location             │
│  - "I Can Help" → Offer form        │
│  - See who else offered             │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  My Help Activity                   │
│  - Requests I posted                │
│  - Offers I made                    │
│  - Completed helps                  │
│  - Ratings & reviews                │
└─────────────────────────────────────┘
```

---

## TASK BREAKDOWN: Help/Errands Feature Enhancement

### Phase 1: Help Requests Screen

#### Task 4.1: Create Help Requests Screen
**Priority**: High
**Estimated Time**: 3 hours
**File**: `Hommie_Mobile/src/screens/HelpRequestsScreen.tsx` (NEW)

**Apple Design Principle**: **Clarity & Organization** - Clear categories, easy browsing.

**Create Help Requests Screen**:

```tsx
// src/screens/HelpRequestsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import HelpPostCard from '../components/HelpPostCard';
import { PostsService, Post } from '../services/postsService';

type HelpCategory = 'all' | 'errand' | 'job' | 'recommendation' | 'advice';
type HelpUrgency = 'all' | 'high' | 'medium' | 'low';
type SortBy = 'recent' | 'urgent' | 'nearby';

const HELP_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'view-grid' },
  { id: 'errand', label: 'Errands', icon: 'bicycle' },
  { id: 'job', label: 'Jobs', icon: 'briefcase' },
  { id: 'recommendation', label: 'Recommendations', icon: 'star' },
  { id: 'advice', label: 'Advice', icon: 'help-circle' },
];

export default function HelpRequestsScreen() {
  const navigation = useNavigation();
  const [helpRequests, setHelpRequests] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<HelpUrgency>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHelpRequests();
  }, [selectedCategory, selectedUrgency, sortBy]);

  const fetchHelpRequests = async () => {
    try {
      setLoading(true);

      // Fetch help posts from PostsService
      const filters = {
        postType: 'help',
        helpCategory: selectedCategory === 'all' ? undefined : selectedCategory,
        urgency: selectedUrgency === 'all' ? undefined : selectedUrgency,
        sortBy: sortBy,
      };

      const response = await PostsService.getInstance().searchPosts('', filters);
      setHelpRequests(response || []);
    } catch (error) {
      console.error('Error fetching help requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchHelpRequests();
    setRefreshing(false);
  };

  const handleCategorySelect = (category: HelpCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleSortChange = () => {
    const sortOptions: SortBy[] = ['recent', 'urgent', 'nearby'];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'recent':
        return 'Most Recent';
      case 'urgent':
        return 'Most Urgent';
      case 'nearby':
        return 'Nearby';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Help</Text>
        <TouchableOpacity style={styles.sortButton} onPress={handleSortChange}>
          <MaterialCommunityIcons name="sort" size={24} color="#00A651" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {HELP_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipActive,
            ]}
            onPress={() => handleCategorySelect(category.id as HelpCategory)}
          >
            <MaterialCommunityIcons
              name={category.icon as any}
              size={18}
              color={
                selectedCategory === category.id ? '#FFFFFF' : '#00A651'
              }
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.id &&
                  styles.categoryChipTextActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort Info Banner */}
      <View style={styles.sortBanner}>
        <Text style={styles.sortBannerText}>
          Showing {helpRequests.length} requests • Sorted by {getSortLabel()}
        </Text>
        <TouchableOpacity onPress={() => setShowFilters(true)}>
          <MaterialCommunityIcons
            name="filter-variant"
            size={20}
            color="#00A651"
          />
        </TouchableOpacity>
      </View>

      {/* Help Requests List */}
      <FlatList
        data={helpRequests}
        renderItem={({ item }) => (
          <HelpPostCard
            post={item}
            onPress={() =>
              navigation.navigate('HelpRequestDetail', {
                requestId: item.id,
              })
            }
            onReact={(reactionType) => {
              // Handle reaction
            }}
            onComment={() => {
              navigation.navigate('HelpRequestDetail', {
                requestId: item.id,
                focusComment: true,
              });
            }}
            onShare={() => {
              // Handle share
            }}
            onRespond={() => {
              navigation.navigate('OfferHelp', { requestId: item.id });
            }}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="hand-right-outline"
              size={64}
              color="#8E8E93"
            />
            <Text style={styles.emptyStateTitle}>No Help Requests</Text>
            <Text style={styles.emptyStateText}>
              Be the first to post a help request in your community!
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate('CreateHelpRequest');
        }}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  sortButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryScroll: {
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  categoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#00A651',
    minHeight: 36,
  },
  categoryChipActive: {
    backgroundColor: '#00A651',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A651',
    marginLeft: 6,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sortBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  sortBannerText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
```

**Acceptance Criteria**:
- ✅ Help Requests screen created
- ✅ Category filtering works (All, Errands, Jobs, etc.)
- ✅ Sorting options work (Recent, Urgent, Nearby)
- ✅ Pull-to-refresh works
- ✅ Empty state displayed when no requests
- ✅ FAB navigates to Create Help Request
- ✅ Apple-style design (clean, organized)

---

#### Task 4.2: Add Help Requests Card to Home Screen
**Priority**: High
**Estimated Time**: 1 hour
**File**: `Hommie_Mobile/src/screens/HomeScreen.tsx`

**Implementation**:

Add prominent Help Requests card after Events banner:

```tsx
{/* After Events Banner */}
<TouchableOpacity
  style={styles.helpRequestsCard}
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('HelpRequests');
  }}
  activeOpacity={0.9}
>
  <View style={styles.helpRequestsContent}>
    <View style={styles.helpRequestsIcon}>
      <MaterialCommunityIcons name="hand-right" size={28} color="#FF6B35" />
    </View>
    <View style={styles.helpRequestsText}>
      <Text style={styles.helpRequestsTitle}>Community Help</Text>
      <Text style={styles.helpRequestsSubtitle}>
        {activeHelpRequests > 0
          ? `${activeHelpRequests} neighbor${activeHelpRequests !== 1 ? 's' : ''} need help`
          : 'Offer or request help from neighbors'
        }
      </Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
  </View>
</TouchableOpacity>
```

**Styles**:
```tsx
helpRequestsCard: {
  backgroundColor: '#FFF4E6',
  marginHorizontal: 16,
  marginBottom: 16,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
  overflow: 'hidden',
},
helpRequestsContent: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 20,
},
helpRequestsIcon: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 16,
},
helpRequestsText: {
  flex: 1,
},
helpRequestsTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: '#1C1C1E',
  marginBottom: 4,
  letterSpacing: -0.4,
},
helpRequestsSubtitle: {
  fontSize: 14,
  color: '#FF6B35',
  fontWeight: '500',
},
```

**Acceptance Criteria**:
- ✅ Help Requests card on Home screen
- ✅ Shows count of active help requests
- ✅ Tapping navigates to HelpRequestsScreen
- ✅ Haptic feedback on tap
- ✅ Apple-style design (warm, inviting)

---

### Phase 2: Help Request Detail & Offer Flow

#### Task 4.3: Create Help Request Detail Screen
**Priority**: High
**Estimated Time**: 2.5 hours
**File**: `Hommie_Mobile/src/screens/HelpRequestDetailScreen.tsx` (NEW)

**Apple Design Principle**: **Depth & Context** - Show all relevant information, make offering help easy.

**Create Help Request Detail Screen**:

```tsx
// src/screens/HelpRequestDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { UserAvatar } from '../components/UserAvatar';
import MapView, { Marker } from 'react-native-maps';
import { Post } from '../services/postsService';

export default function HelpRequestDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId } = route.params;
  const [helpRequest, setHelpRequest] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetchHelpRequestDetail();
  }, [requestId]);

  const fetchHelpRequestDetail = async () => {
    try {
      // Fetch help request detail and offers
      // const data = await PostsService.getPostDetail(requestId);
      // setHelpRequest(data.post);
      // setOffers(data.offers);
    } catch (error) {
      console.error('Error fetching help request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfferHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('OfferHelp', { requestId: helpRequest.id });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '#E74C3C';
      case 'medium':
        return '#FFC107';
      case 'low':
        return '#00A651';
      default:
        return '#8E8E93';
    }
  };

  if (loading || !helpRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Request</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Requester Info */}
        <View style={styles.requesterSection}>
          <UserAvatar
            user={helpRequest.author}
            size="large"
            showBadge={helpRequest.author.isVerified}
          />
          <View style={styles.requesterInfo}>
            <Text style={styles.requesterName}>
              {helpRequest.author.firstName} {helpRequest.author.lastName}
            </Text>
            <Text style={styles.requesterLocation}>
              {helpRequest.author.estate || 'Same estate'}
            </Text>
            {helpRequest.author.trustScore && (
              <View style={styles.trustScoreBadge}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={14}
                  color="#00A651"
                />
                <Text style={styles.trustScoreText}>
                  Trust Score: {helpRequest.author.trustScore}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Category & Urgency Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.categoryBadge}>
            <MaterialCommunityIcons
              name="bicycle"
              size={16}
              color="#FF6B35"
            />
            <Text style={styles.badgeText}>
              {helpRequest.helpCategory?.toUpperCase()}
            </Text>
          </View>

          <View
            style={[
              styles.urgencyBadge,
              { backgroundColor: getUrgencyColor(helpRequest.urgency) + '20' },
            ]}
          >
            <MaterialCommunityIcons
              name="alert-circle"
              size={16}
              color={getUrgencyColor(helpRequest.urgency)}
            />
            <Text
              style={[
                styles.badgeText,
                { color: getUrgencyColor(helpRequest.urgency) },
              ]}
            >
              {helpRequest.urgency?.toUpperCase()} URGENCY
            </Text>
          </View>
        </View>

        {/* Request Content */}
        <View style={styles.contentSection}>
          <Text style={styles.requestTitle}>Request Details</Text>
          <Text style={styles.requestText}>{helpRequest.content}</Text>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          {helpRequest.budget && (
            <View style={styles.detailCard}>
              <MaterialCommunityIcons
                name="cash"
                size={24}
                color="#00A651"
              />
              <Text style={styles.detailLabel}>Budget</Text>
              <Text style={styles.detailValue}>{helpRequest.budget}</Text>
            </View>
          )}

          {helpRequest.deadline && (
            <View style={styles.detailCard}>
              <MaterialCommunityIcons name="clock" size={24} color="#FF6B35" />
              <Text style={styles.detailLabel}>Deadline</Text>
              <Text style={styles.detailValue}>
                {new Date(helpRequest.deadline).toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.detailCard}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#2196F3" />
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {helpRequest.location || 'Nearby'}
            </Text>
          </View>
        </View>

        {/* Map (if location available) */}
        {helpRequest.coordinates && (
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: helpRequest.coordinates.latitude,
                longitude: helpRequest.coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: helpRequest.coordinates.latitude,
                  longitude: helpRequest.coordinates.longitude,
                }}
              />
            </MapView>
          </View>
        )}

        {/* Who's Helping */}
        {offers.length > 0 && (
          <View style={styles.offersSection}>
            <Text style={styles.sectionTitle}>
              {offers.length} Neighbor{offers.length !== 1 ? 's' : ''} Offered to Help
            </Text>
            {offers.map((offer) => (
              <TouchableOpacity key={offer.id} style={styles.offerCard}>
                <UserAvatar user={offer.helper} size="medium" showBadge />
                <View style={styles.offerInfo}>
                  <Text style={styles.offerName}>
                    {offer.helper.firstName} {offer.helper.lastName}
                  </Text>
                  <Text style={styles.offerMessage}>
                    {offer.message || 'Offered to help'}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#8E8E93"
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.offerButton}
          onPress={handleOfferHelp}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="hand-right"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.offerButtonText}>I Can Help</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    color: '#1C1C1E',
  },
  content: {
    flex: 1,
  },
  requesterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 2,
  },
  requesterInfo: {
    marginLeft: 16,
    flex: 1,
  },
  requesterName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  requesterLocation: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 6,
  },
  trustScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustScoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00A651',
    marginLeft: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 2,
  },
  requestTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  requestText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  detailCard: {
    width: '31%',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  map: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  offersSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 2,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  offerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  offerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  offerMessage: {
    fontSize: 13,
    color: '#8E8E93',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00A651',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 52,
  },
  offerButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
```

**Acceptance Criteria**:
- ✅ Detail screen shows complete help request
- ✅ Requester info with Trust Score visible
- ✅ Category and urgency badges shown
- ✅ Budget, deadline, location displayed
- ✅ Map shows location (if available)
- ✅ List of offers visible
- ✅ "I Can Help" button navigates to offer flow
- ✅ Apple-style design (clear, informative)

---

#### Task 4.4: Create Offer Help Screen
**Priority**: High
**Estimated Time**: 2 hours
**File**: `Hommie_Mobile/src/screens/OfferHelpScreen.tsx` (NEW)

**Apple Design Principle**: **Simplicity** - Make offering help quick and easy.

**Create Offer Help Screen**:

```tsx
// src/screens/OfferHelpScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function OfferHelpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { requestId } = route.params;
  const [message, setMessage] = useState('');
  const [availability, setAvailability] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitOffer = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please add a message with your offer.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);

    try {
      // Submit offer to API
      // await HelpService.submitOffer(requestId, { message, availability });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Offer Sent!',
        'Your offer has been sent to your neighbor. They\'ll contact you soon!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              navigation.goBack(); // Go back twice to return to list
            },
          },
        ]
      );
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to send offer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer Help</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="information"
              size={24}
              color="#00A651"
            />
            <Text style={styles.infoText}>
              Let your neighbor know how you can help and when you're available.
            </Text>
          </View>

          {/* Message Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Your Message *</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Hi! I'd be happy to help with this. I can..."
              placeholderTextColor="#8E8E93"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Availability Input */}
          <View style={styles.section}>
            <Text style={styles.label}>When are you available?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Today after 5pm, Tomorrow morning"
              placeholderTextColor="#8E8E93"
              value={availability}
              onChangeText={setAvailability}
            />
          </View>

          {/* Safety Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Safety Tips</Text>
            <View style={styles.tip}>
              <MaterialCommunityIcons name="check" size={16} color="#00A651" />
              <Text style={styles.tipText}>
                Meet in public places when possible
              </Text>
            </View>
            <View style={styles.tip}>
              <MaterialCommunityIcons name="check" size={16} color="#00A651" />
              <Text style={styles.tipText}>
                Let someone know where you're going
              </Text>
            </View>
            <View style={styles.tip}>
              <MaterialCommunityIcons name="check" size={16} color="#00A651" />
              <Text style={styles.tipText}>
                Trust your instincts - it's okay to decline
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submittingButton]}
            onPress={handleSubmitOffer}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Sending...' : 'Send Offer'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    color: '#1C1C1E',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 12,
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  messageInput: {
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    height: 120,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 2,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#3C3C43',
    marginLeft: 8,
    lineHeight: 20,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  submitButton: {
    backgroundColor: '#00A651',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  submittingButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

**Acceptance Criteria**:
- ✅ Offer form with message and availability
- ✅ Safety tips displayed
- ✅ Submit button disabled during submission
- ✅ Success feedback with haptics
- ✅ Navigates back after submission
- ✅ Apple-style design (simple, clear)

---

### Phase 3: My Help Activity

#### Task 4.5: Create My Help Activity Screen
**Priority**: Medium
**Estimated Time**: 2.5 hours
**File**: `Hommie_Mobile/src/screens/MyHelpActivityScreen.tsx` (NEW)

**Apple Design Principle**: **Organization** - Clear tabs for different activity types.

**Create My Help Activity Screen**:

```tsx
// src/screens/MyHelpActivityScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

type TabType = 'requests' | 'offers' | 'completed';

export default function MyHelpActivityScreen() {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<TabType>('requests');
  const [myRequests, setMyRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [completedHelps, setCompletedHelps] = useState([]);

  const renderRequestCard = ({ item }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() =>
        navigation.navigate('HelpRequestDetail', { requestId: item.id })
      }
    >
      <View style={styles.activityHeader}>
        <Text style={styles.activityTitle}>{item.content}</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="#8E8E93"
        />
      </View>
      <Text style={styles.activityMeta}>
        {item.offersCount} offer{item.offersCount !== 1 ? 's' : ''} • Posted{' '}
        {formatDate(item.createdAt)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Help Activity</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'requests' && styles.activeTab]}
          onPress={() => setSelectedTab('requests')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'requests' && styles.activeTabText,
            ]}
          >
            My Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'offers' && styles.activeTab]}
          onPress={() => setSelectedTab('offers')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'offers' && styles.activeTabText,
            ]}
          >
            Offers Made
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'completed' && styles.activeTabText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on selected tab */}
      <FlatList
        data={
          selectedTab === 'requests'
            ? myRequests
            : selectedTab === 'offers'
            ? myOffers
            : completedHelps
        }
        renderItem={renderRequestCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
    color: '#1C1C1E',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00A651',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#00A651',
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  activityMeta: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
```

**Acceptance Criteria**:
- ✅ Three tabs: My Requests, Offers Made, Completed
- ✅ Lists appropriate items per tab
- ✅ Cards navigate to detail screen
- ✅ Apple-style tabbed design

---

## Summary

### Total Tasks: 5 Tasks
### Estimated Time: 11 hours

**Week 1: Help/Errands Enhancement**
- Day 1: Help Requests Screen + Home card (4 hours)
- Day 2: Help Request Detail + Offer flow (4.5 hours)
- Day 3: My Help Activity + testing (2.5 hours)

### Testing Checklist
- [ ] Help Requests screen shows all help posts
- [ ] Category and urgency filtering works
- [ ] Help card on Home screen works
- [ ] Detail screen shows complete info
- [ ] Map displays location correctly
- [ ] Offer form submits successfully
- [ ] Success notifications work
- [ ] My Activity tabs work
- [ ] All navigation flows correct

### Success Metrics
- ✅ 70% increase in help request creation
- ✅ 50% of requests receive offers within 24 hours
- ✅ Clear distinction between help posts and regular posts
- ✅ Users find Help feature intuitive

**End of Help/Errands Feature Enhancement**
