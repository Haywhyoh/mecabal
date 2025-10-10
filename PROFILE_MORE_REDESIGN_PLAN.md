# Profile, More & Dashboard Redesign Plan
## Following Apple Human Interface Guidelines

---

## Executive Summary

**Problem**: Current implementation has severe redundancy between Profile screen, More screen, and Home sidebar. Dashboard stats appear 3 times, community metrics are duplicated, and navigation paths overlap.

**Solution**: Restructure screens with clear separation of concerns following Apple's principles of Clarity, Deference, and Depth.

**Scope**:
- Redesign Profile Screen (identity & achievement)
- Redesign More Screen (settings & actions)
- Create new Dashboard Screen (saved items & activity)
- Simplify Home Sidebar (quick navigation only)

---

## Apple Design Principles Applied

### 1. **Clarity**
- Each screen has ONE clear purpose
- Text is legible at every size
- Icons are precise and clear
- Adornment is subtle and appropriate

### 2. **Deference**
- Content takes priority over UI elements
- Full-screen experiences are encouraged
- UI helps people understand content without competing with it

### 3. **Depth**
- Visual layers and motion convey hierarchy
- Touch and discoverability heighten delight
- Transitions provide sense of continuity

### 4. **Information Hierarchy**
- Most important content at the top
- Related items grouped together
- Progressive disclosure for complex information
- Breathing room between sections

### 5. **Consistency**
- Similar functions look and behave similarly across app
- System-provided UI elements used where appropriate
- Familiar patterns from iOS/Apple apps

---

## Current State Analysis

### Profile Screen Issues
```
CURRENT STRUCTURE:
1. Profile Header (avatar, name, location)
2. Find Neighbors CTA
3. Edit Profile Button
4. Verification Section
5. Trust Score Card (FULL)
6. Dashboard Stats Card (FULL)
7. Dashboard Section (DUPLICATE) ← REDUNDANT
   - Bookmarks
   - Saved Deals
   - Events
8. Profile Enhancement
9. Community Stats (DUPLICATE) ← REDUNDANT
   - Posts Shared
   - Neighbors Helped
   - Events Joined
10. Quick Actions (Settings, Privacy, Notifications, Help)
11. Business Profile CTA
12. Sign Out

PROBLEMS:
- Dashboard appears TWICE (lines 302-312, then 314-370)
- Community stats appear TWICE (in Dashboard Card, then again 387-413)
- Quick Actions duplicate More screen functionality
- Too much information density
- No clear visual hierarchy
```

### More Screen Issues
```
CURRENT STRUCTURE:
1. Profile Header (avatar, name, location, edit button)
2. Your Profile Section
   - View & Edit Profile
   - Community Badges
   - Verification Center
   - Location Test
   - Map Picker
3. Community Section
   - Events Calendar
   - Neighbor Connections
   - Local Business Directory
   - Community Activity
4. Safety & Civic Section
5. Business Section
6. Settings & Support Section
7. Footer

PROBLEMS:
- Profile display duplicates Profile screen
- Community items duplicate Home sidebar
- Unclear distinction from Profile screen
- Too many navigation options
- Settings buried at bottom
```

### Home Sidebar Issues
```
CURRENT STRUCTURE:
1. Profile header
2. Personal Profile → duplicates Profile screen
3. Business Profile → duplicates More screen
4. Community Activity → duplicates More screen
5. Neighbor Network → duplicates More screen
6. Local Businesses → duplicates More screen
7. Events → duplicates More screen
8. Settings footer
9. Help footer

PROBLEMS:
- Complete duplication of More screen
- No clear purpose for sidebar vs More screen
- Too many menu items
```

---

## Proposed Architecture

### Screen Purposes

| Screen | Purpose | Key Question |
|--------|---------|--------------|
| **Profile** | Identity & Achievement | "Who am I in this community?" |
| **Dashboard** | Activity & Saved Items | "What have I saved and where am I active?" |
| **More** | Settings & Actions | "What can I do?" |
| **Home Sidebar** | Quick Navigation | "How do I get somewhere fast?" |

---

## Task Breakdown for Developers

---

## PHASE 1: Profile Screen Redesign

### Task 1.1: Remove Duplicate Dashboard Section
**Priority**: High
**Estimated Time**: 30 minutes
**File**: `Hommie_Mobile/src/screens/ProfileScreen.tsx`

**Current Code Location**: Lines 314-370

**What to Remove**:
```tsx
{/* Dashboard */}
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>Dashboard</Text>
    <View style={styles.privacyIndicator}>
      <MaterialCommunityIcons name="eye-off" size={14} color="#8E8E8E" />
      <Text style={styles.privacyText}>Only visible to you</Text>
    </View>
  </View>

  {/* All the dashboard grid content... */}
</View>
```

**Apple Design Principle**: **Clarity** - Remove redundant information that confuses users about where to find data.

**Steps**:
1. Locate the section starting at line 314 with comment `{/* Dashboard */}`
2. Delete entire section including:
   - Section wrapper
   - Dashboard grid (Bookmarks, Saved Deals)
   - Events card
   - All related loading states
3. Remove these style definitions from StyleSheet:
   - `dashboardGrid`
   - `dashboardCard` (if not used elsewhere)
   - `dashboardTitle`
   - `dashboardCount`
4. Test that screen still renders correctly
5. Verify no runtime errors

**Acceptance Criteria**:
- ✅ Dashboard section completely removed from Profile screen
- ✅ No style warnings in console
- ✅ Screen renders without errors
- ✅ Remaining sections display correctly

---

### Task 1.2: Remove Duplicate Community Impact Section
**Priority**: High
**Estimated Time**: 20 minutes
**File**: `Hommie_Mobile/src/screens/ProfileScreen.tsx`

**Current Code Location**: Lines 387-413

**What to Remove**:
```tsx
{/* Community Stats */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Your Community Impact</Text>

  {/* Stats grid with Posts, Neighbors Helped, Events */}
</View>
```

**Apple Design Principle**: **Clarity** - Each piece of information should appear once, in its most logical location.

**Steps**:
1. Locate section starting at line 387 with comment `{/* Community Stats */}`
2. Delete entire section including:
   - Section wrapper
   - Stats grid (Posts Shared, Neighbors Helped, Events Joined)
   - Loading states
3. Remove these style definitions (if not used elsewhere):
   - `statsGrid`
   - `statCard`
   - `statNumber`
   - `statLabel`
4. Test that DashboardStatsCard still shows this data

**Acceptance Criteria**:
- ✅ Community Impact section removed
- ✅ DashboardStatsCard remains and shows community data
- ✅ No duplicate information visible
- ✅ Screen still scrollable and functional

---

### Task 1.3: Update DashboardStatsCard to Compact Mode
**Priority**: High
**Estimated Time**: 45 minutes
**Files**:
- `Hommie_Mobile/src/screens/ProfileScreen.tsx`
- `Hommie_Mobile/src/components/DashboardStatsCard.tsx`

**Apple Design Principle**: **Deference** - UI should help users understand content without competing with it. Use compact views to surface information without overwhelming.

**Objective**: Make DashboardStatsCard show summary view with tap-to-expand functionality.

**Changes to DashboardStatsCard.tsx**:

1. **Add compact mode visual changes**:
```tsx
// In render function, when compact={true}:
- Show only top 3 stats (Bookmarks, Saved Deals, Events)
- Display in horizontal scrollable row (ScrollView horizontal)
- Smaller card size (120px x 120px)
- Icon + number only, no descriptions
- Add "View All" button at end
```

2. **Layout for Compact Mode**:
```tsx
{compact ? (
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
    >
      <MaterialCommunityIcons name="arrow-right-circle" size={32} color="#00A651" />
      <Text style={styles.viewAllText}>View All</Text>
    </TouchableOpacity>
  </ScrollView>
) : (
  // Existing full view
)}
```

3. **Add new styles**:
```tsx
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
```

**Changes to ProfileScreen.tsx**:

```tsx
// Update DashboardStatsCard usage (around line 303):
<View style={styles.dashboardStatsSection}>
  <DashboardStatsCard
    dashboardStats={contextDashboardStats || dashboardStats}
    loading={profileLoading || isLoadingStats}
    compact={true}  // Add this prop
    onViewAll={() => navigation.navigate('Dashboard' as never)}  // Add navigation
    onStatPress={(statType, data) => {
      // Navigate to Dashboard with specific tab/filter
      navigation.navigate('Dashboard' as never, { focus: statType });
    }}
  />
</View>
```

**Acceptance Criteria**:
- ✅ Card displays horizontally scrollable stats when compact={true}
- ✅ Only 3 most important stats shown (Bookmarks, Saved Deals, Events)
- ✅ Each stat card is 120x120px with icon + number
- ✅ "View All" button at end navigates to Dashboard screen
- ✅ Cards use Apple-style shadows (subtle, 0.08 opacity)
- ✅ Smooth horizontal scrolling
- ✅ Cards have proper touch feedback (activeOpacity: 0.7)
- ✅ Maintains existing functionality in full mode

---

### Task 1.4: Update TrustScoreCard to Compact Mode
**Priority**: High
**Estimated Time**: 45 minutes
**Files**:
- `Hommie_Mobile/src/screens/ProfileScreen.tsx`
- `Hommie_Mobile/src/components/TrustScoreCard.tsx`

**Apple Design Principle**: **Progressive Disclosure** - Show essential information first, detailed information on demand.

**Objective**: Make TrustScoreCard show summary in Profile, full details on tap.

**Changes to TrustScoreCard.tsx**:

1. **Modify compact mode rendering**:
```tsx
// When compact={true}, show:
- Circular score badge (larger)
- Score number and level name
- Next level indicator
- Small "Tap to view details" hint
- NO breakdown section
- NO progress bars
```

2. **Compact Layout**:
```tsx
{compact ? (
  <TouchableOpacity
    style={[styles.container, styles.containerCompact]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.compactRow}>
      {/* Left: Large circular score */}
      <LinearGradient
        colors={gradientColors}
        style={styles.compactScoreCircle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.scoreCircleInner}>
          <MaterialCommunityIcons name={levelIcon} size={40} color="#FFFFFF" />
          <Text style={styles.compactScoreText}>{trustScore.score}</Text>
        </View>
      </LinearGradient>

      {/* Right: Score info */}
      <View style={styles.compactInfo}>
        <Text style={styles.compactTitle}>Trust Score</Text>
        <Text style={[styles.compactLevel, { color: scoreColor }]}>
          {trustScore.level}
        </Text>
        <Text style={styles.compactNextLevel}>
          {trustScore.pointsToNextLevel} points to {trustScore.nextLevel}
        </Text>
      </View>

      {/* Arrow indicator */}
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color="#8E8E8E"
      />
    </View>

    {/* Tap hint */}
    <Text style={styles.tapHint}>Tap to view breakdown</Text>
  </TouchableOpacity>
) : (
  // Existing full view
)}
```

3. **Add new styles**:
```tsx
compactRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},
compactScoreCircle: {
  width: 100,
  height: 100,
  borderRadius: 50,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 16,
  // Apple-style shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
},
compactScoreText: {
  fontSize: 24,
  fontWeight: '700',
  color: '#FFFFFF',
  marginTop: 4,
},
compactInfo: {
  flex: 1,
},
compactTitle: {
  fontSize: 13,
  fontWeight: '500',
  color: '#8E8E8E',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
compactLevel: {
  fontSize: 22,
  fontWeight: '700',
  marginBottom: 4,
},
compactNextLevel: {
  fontSize: 13,
  color: '#8E8E8E',
},
tapHint: {
  fontSize: 12,
  color: '#00A651',
  textAlign: 'center',
  fontWeight: '500',
},
```

**Changes to ProfileScreen.tsx**:

```tsx
// Update TrustScoreCard usage (around line 291):
<View style={styles.trustScoreSection}>
  <TrustScoreCard
    trustScore={trustScore}
    loading={profileLoading}
    compact={true}  // Add this prop
    showBreakdown={false}  // Hide breakdown in compact mode
    onPress={() => {
      // Navigate to dedicated Trust Score detail screen
      navigation.navigate('TrustScoreDetail' as never);
      // OR show modal with full details
      // Alert.alert('Trust Score', 'Full breakdown...');
    }}
  />
</View>
```

**Acceptance Criteria**:
- ✅ Card displays horizontal layout when compact={true}
- ✅ Large circular score badge (100x100px) on left
- ✅ Score, level, and next level info on right
- ✅ Chevron indicator shows it's tappable
- ✅ "Tap to view breakdown" hint at bottom
- ✅ Breakdown section hidden in compact mode
- ✅ Smooth tap animation (activeOpacity: 0.7)
- ✅ Apple-style shadow on score circle
- ✅ Maintains existing functionality in full mode

---

### Task 1.5: Reorganize Profile Screen Section Order
**Priority**: Medium
**Estimated Time**: 30 minutes
**File**: `Hommie_Mobile/src/screens/ProfileScreen.tsx`

**Apple Design Principle**: **Information Hierarchy** - Most important content at the top, logical grouping, breathing room between sections.

**Objective**: Reorder sections to follow Apple's content hierarchy patterns.

**New Order** (Top to Bottom):
```tsx
<ScrollView>
  {/* 1. IDENTITY - Who am I? */}
  <View style={styles.profileSection}>
    <UserProfile />
    <LocationContainer />
  </View>

  {/* 2. ACHIEVEMENT - My standing */}
  <View style={styles.trustScoreSection}>
    <TrustScoreCard compact={true} />
  </View>

  {/* 3. VERIFICATION - Build trust */}
  <View style={styles.verificationSection}>
    {/* NIN & Document verification buttons */}
  </View>

  {/* 4. ACTIVITY SUMMARY - What I'm doing */}
  <View style={styles.dashboardStatsSection}>
    <DashboardStatsCard compact={true} />
  </View>

  {/* 5. IMPROVEMENT - Make profile better */}
  <View style={styles.section}>
    <Text style={styles.enhancementTitle}>
      Better profile, better MeCabal
    </Text>
    {/* Profile completion prompt */}
  </View>

  {/* 6. CONNECTIONS - Build network */}
  <TouchableOpacity style={styles.findNeighborsCard}>
    {/* Find and connect with neighbors */}
  </TouchableOpacity>

  {/* 7. ACTIONS - Primary actions */}
  <TouchableOpacity style={styles.editProfileButton}>
    {/* Edit Profile */}
  </TouchableOpacity>

  {/* 8. BUSINESS - Optional feature */}
  <TouchableOpacity style={styles.businessCard}>
    {/* Add business page */}
  </TouchableOpacity>

  {/* 9. SIGN OUT - Destructive action at bottom */}
  <TouchableOpacity style={styles.signOutButton}>
    {/* Sign out */}
  </TouchableOpacity>
</ScrollView>
```

**REMOVE These Sections**:
- ❌ Quick Actions (Settings, Privacy, Notifications, Help) - Move to More screen
- ❌ Duplicate Dashboard section
- ❌ Duplicate Community Impact section

**Spacing Guidelines** (Apple 8pt grid):
```tsx
// Between major sections
marginBottom: 16,  // 2 units

// Within sections
padding: 20,  // 2.5 units (preferred for card padding)

// Between section groups (identity → achievement)
marginBottom: 24,  // 3 units
```

**Acceptance Criteria**:
- ✅ Sections in logical order (identity → achievement → verification → activity)
- ✅ Most important content at top (profile, trust score)
- ✅ Destructive action (sign out) at bottom
- ✅ Consistent spacing using 8pt grid
- ✅ Breathing room between sections (16-24px margins)
- ✅ No duplicate sections remain

---

### Task 1.6: Remove Quick Actions from Profile
**Priority**: Medium
**Estimated Time**: 15 minutes
**File**: `Hommie_Mobile/src/screens/ProfileScreen.tsx`

**Current Code Location**: Lines 415-442

**Apple Design Principle**: **Clarity** - Each screen has one purpose. Settings belong in More screen, not Profile.

**What to Remove**:
```tsx
{/* Quick Actions */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Quick Actions</Text>

  <TouchableOpacity style={styles.actionItem}>
    <MaterialCommunityIcons name="account-edit" size={20} color="#00A651" />
    <Text style={styles.actionText}>Account Settings</Text>
    {/* ... */}
  </TouchableOpacity>

  {/* Privacy, Notifications, Help items */}
</View>
```

**Rationale**:
- Settings functionality belongs in More screen
- Profile screen should focus on identity and achievement only
- Reduces cognitive load

**Steps**:
1. Delete entire Quick Actions section (lines 415-442)
2. Remove unused style definitions:
   - `actionItem`
   - `actionText`
3. Verify More screen has these features (should already exist)

**Acceptance Criteria**:
- ✅ Quick Actions section removed from Profile
- ✅ Features still accessible via More screen
- ✅ Profile screen focuses on identity/achievement only
- ✅ No broken navigation

---

### Task 1.7: Update Profile Screen Styles for Apple Aesthetic
**Priority**: Medium
**Estimated Time**: 1 hour
**File**: `Hommie_Mobile/src/screens/ProfileScreen.tsx`

**Apple Design Principles**: **Clarity, Deference, Visual Design**

**Changes to Apply**:

1. **Card Shadows** (Apple-style subtle shadows):
```tsx
section: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 16,
  marginBottom: 16,
  padding: 20,
  borderRadius: 16,  // Increased from 12
  // Apple-style shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,  // Very subtle
  shadowRadius: 8,
  elevation: 2,
},
```

2. **Typography** (SF Pro Display/Text inspired):
```tsx
// Headers
sectionTitle: {
  fontSize: 20,  // Or 22 for main sections
  fontWeight: '700',  // Bold for headers
  color: '#1C1C1E',  // Apple's dark color
  marginBottom: 16,
  letterSpacing: -0.4,  // Tight tracking for headers
},

// Body text
enhancementSubtitle: {
  fontSize: 15,  // Apple's preferred body size
  color: '#8E8E93',  // Apple's secondary text color
  lineHeight: 20,
  marginBottom: 16,
  letterSpacing: -0.2,
},

// Small text
privacyText: {
  fontSize: 13,
  color: '#8E8E93',
  fontWeight: '400',
},
```

3. **Button Styles** (Apple-style buttons):
```tsx
editProfileButton: {
  backgroundColor: '#F5F5F5',  // Keep subtle
  marginHorizontal: 16,
  marginBottom: 16,
  paddingVertical: 14,  // Slightly larger touch target
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  // Add subtle shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 1,
},

// Primary action button
verificationButton: {
  flex: 1,
  backgroundColor: '#FFFFFF',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 14,
  paddingHorizontal: 16,
  borderRadius: 12,
  borderWidth: 1.5,  // Slightly thicker border
  borderColor: '#E5E5EA',  // Apple's separator color
  // Active state with shadow
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  elevation: 1,
},
```

4. **Colors** (Apple's system colors):
```tsx
// Update color values throughout:
const COLORS = {
  // Primary
  primary: '#00A651',  // Keep brand color

  // Apple system grays
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',

  // Backgrounds
  primaryBackground: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  tertiaryBackground: '#FAFAFA',

  // Labels
  label: '#000000',
  secondaryLabel: '#3C3C43',  // 60% opacity
  tertiaryLabel: '#3C3C43',   // 30% opacity

  // Destructive
  destructive: '#FF3B30',
};
```

5. **Spacing** (8pt grid system):
```tsx
// All margins and paddings should be multiples of 8:
const SPACING = {
  xs: 4,   // 0.5 units
  sm: 8,   // 1 unit
  md: 16,  // 2 units
  lg: 24,  // 3 units
  xl: 32,  // 4 units
  xxl: 48, // 6 units
};

// Apply consistently:
marginHorizontal: 16,
marginBottom: 16,
padding: 20,  // Allowed: 2.5 units for card padding
```

6. **Border Radius** (Apple's preferred radii):
```tsx
// Cards and major containers
borderRadius: 16,

// Buttons and smaller elements
borderRadius: 12,

// Pills and small badges
borderRadius: 8,

// Circular elements
borderRadius: 50% of width/height,
```

**Acceptance Criteria**:
- ✅ All shadows use Apple-style subtlety (0.04-0.10 opacity)
- ✅ Typography uses appropriate sizes (13, 15, 17, 20, 22)
- ✅ Letter spacing applied to headers (-0.4) and body (-0.2)
- ✅ Colors match Apple's system palette
- ✅ All spacing uses 8pt grid system
- ✅ Border radius consistent (16 for cards, 12 for buttons)
- ✅ Touch targets minimum 44pt (44x44px)
- ✅ Overall aesthetic feels "Apple-like"

---

## PHASE 2: Create New Dashboard Screen

### Task 2.1: Create DashboardScreen.tsx
**Priority**: High
**Estimated Time**: 2 hours
**File**: `Hommie_Mobile/src/screens/DashboardScreen.tsx` (NEW)

**Apple Design Principle**: **Deference** - Content is king. Dashboard should clearly show user's saved items and activity.

**Screen Purpose**:
- Show all saved items (bookmarks, deals)
- Display event activity (attending, organized, history)
- Show community activity metrics
- Provide quick action buttons

**Layout Structure**:
```
┌─────────────────────────────┐
│ [←]     Dashboard       [ ] │ ← Header
├─────────────────────────────┤
│ 🔒 Only visible to you      │ ← Privacy indicator
├─────────────────────────────┤
│ Saved Items             ────│ ← Section
│ ┌──────────┐ ┌──────────┐  │
│ │ 📑       │ │ 🏷️       │  │ ← Cards
│ │    12    │ │    5     │  │
│ │Bookmarks │ │  Deals   │  │
│ └──────────┘ └──────────┘  │
├─────────────────────────────┤
│ Your Events        See All→ │ ← Section with action
│ ┌─────────────────────────┐ │
│ │ ✓  Attending            │ │ ← List items
│ │    3 upcoming events    │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ⭐ Organized            │ │
│ │    2 events created     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ Community Activity          │
│ ┌────┐ ┌────┐ ┌────┐       │ ← Stat cards
│ │ 15 │ │ 8  │ │ 12 │       │
│ │Post│ │Help│ │Link│       │
│ └────┘ └────┘ └────┘       │
├─────────────────────────────┤
│ Quick Actions               │
│ ┌─────────────────────────┐ │
│ │ ➕ Create Post          │ │ ← Action buttons
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Implementation Details**:

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useProfile } from '../contexts/ProfileContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { dashboardStats, loading, refreshDashboard } = useProfile();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
              onPress={() => navigation.navigate('Bookmarks', { type: 'post' })}
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
              onPress={() => navigation.navigate('Bookmarks', { type: 'listing' })}
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
            <TouchableOpacity onPress={() => navigation.navigate('Events')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Event list items */}
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

          {/* More event items... */}
        </View>

        {/* Community Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Activity</Text>
          <View style={styles.statsGrid}>
            {/* Stat cards */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: '#F3E5F5' }]}>
                <MaterialCommunityIcons name="post" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.statNumber}>
                {dashboardStats?.posts.shared || 0}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            {/* More stat cards... */}
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
          {/* More action buttons... */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Styles** (Apple-inspired):
```tsx
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    letterSpacing: -0.4,
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
  // ... more styles
});
```

**Acceptance Criteria**:
- ✅ Screen displays all saved items (bookmarks, deals)
- ✅ Events section shows attending, organized, history
- ✅ Community activity stats displayed
- ✅ Quick action buttons functional
- ✅ Pull-to-refresh works
- ✅ Navigation back to Profile works
- ✅ Privacy indicator at top
- ✅ Apple-style design (shadows, colors, typography)
- ✅ All touch targets minimum 44pt
- ✅ Smooth animations and transitions

---

### Task 2.2: Add Dashboard Navigation to App
**Priority**: High
**Estimated Time**: 30 minutes
**File**: `Hommie_Mobile/App.tsx` or navigation configuration file

**Objective**: Register Dashboard screen in navigation system.

**Changes**:
```tsx
// In your navigation stack configuration:
<Stack.Screen
  name="Dashboard"
  component={DashboardScreen}
  options={{
    title: 'Dashboard',
    headerShown: false,  // We have custom header
  }}
/>
```

**Acceptance Criteria**:
- ✅ Dashboard screen registered in navigation
- ✅ Can navigate to Dashboard from Profile
- ✅ Can navigate back from Dashboard
- ✅ Screen transitions smoothly

---

## PHASE 3: Refactor More Screen

### Task 3.1: Remove Profile Duplication from More Screen
**Priority**: High
**Estimated Time**: 45 minutes
**File**: `Hommie_Mobile/src/screens/MoreScreen.tsx`

**Apple Design Principle**: **Clarity** - More screen is for settings and actions, not profile viewing.

**Current Code Location**: Lines 72-114 (Your Profile section)

**Changes**:

1. **Simplify Profile Header** (keep lines 266-327):
```tsx
// KEEP: Simple profile thumbnail at top
const ProfileHeader = () => (
  <TouchableOpacity
    style={styles.profileHeader}
    onPress={() => handleNavigation('Profile')}
  >
    <UserAvatar user={user} size="small" showBadge={false} />
    <View style={styles.profileInfo}>
      <Text style={styles.profileName}>{getUserName()}</Text>
      <Text style={styles.viewProfileText}>View Profile</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#8E8E93" />
  </TouchableOpacity>
);
```

2. **Remove "Your Profile" Section**:
```tsx
// DELETE this entire section:
{
  title: 'Your Profile',
  items: [
    {
      id: 'profile',
      title: 'View & Edit Profile',
      subtitle: 'Manage your community presence',
      // ...
    },
    // All profile-related items
  ],
},
```

**Rationale**:
- Profile viewing/editing → Profile screen
- Badges → Profile screen (as part of achievement)
- Verification → Profile screen (already there)
- Location/Map tests → Remove (dev tools)

**New Structure**:
```tsx
const menuSections: MenuSection[] = [
  // NO "Your Profile" section

  {
    title: 'Account',  // NEW: Consolidated account management
    items: [
      {
        id: 'profile',
        title: 'Profile',
        subtitle: 'View and edit your profile',
        icon: 'account-circle',
        onPress: () => handleNavigation('Profile'),
      },
      {
        id: 'dashboard',  // NEW: Link to dashboard
        title: 'Dashboard',
        subtitle: 'Your saved items and activity',
        icon: 'view-dashboard',
        onPress: () => handleNavigation('Dashboard'),
      },
    ],
  },

  {
    title: 'Community',
    items: [
      // Keep existing community items
    ],
  },

  // ... rest of sections
];
```

**Acceptance Criteria**:
- ✅ Profile duplication removed
- ✅ Simple profile header remains (avatar + name only)
- ✅ "View Profile" link navigates to Profile screen
- ✅ Dashboard added to Account section
- ✅ Dev tools (Location Test, Map Picker) removed

---

### Task 3.2: Reorganize More Screen Sections
**Priority**: Medium
**Estimated Time**: 1 hour
**File**: `Hommie_Mobile/src/screens/MoreScreen.tsx`

**Apple Design Principle**: **Information Hierarchy** - Group related items, most used items first.

**New Section Structure**:

```tsx
const menuSections: MenuSection[] = [
  // SECTION 1: Account Management
  {
    title: 'Account',
    items: [
      {
        id: 'profile',
        title: 'Profile',
        subtitle: 'View and edit your profile',
        icon: 'account-circle',
        iconColor: '#00A651',
        onPress: () => handleNavigation('Profile'),
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        subtitle: 'Saved items and activity',
        icon: 'view-dashboard',
        iconColor: '#0066CC',
        onPress: () => handleNavigation('Dashboard'),
      },
      {
        id: 'verification',
        title: 'Verification',
        subtitle: 'Verify your identity',
        icon: 'shield-check',
        iconColor: '#2196F3',
        onPress: () => handleNavigation('NINVerification'),
      },
    ],
  },

  // SECTION 2: Community Features
  {
    title: 'Community',
    items: [
      {
        id: 'events',
        title: 'Events',
        subtitle: 'Community events and gatherings',
        icon: 'calendar-multiple',
        iconColor: '#7B68EE',
        onPress: () => handleNavigation('Events'),
      },
      {
        id: 'neighbors',
        title: 'Neighbors',
        subtitle: 'Connect with your community',
        icon: 'account-group',
        iconColor: '#9C27B0',
        onPress: () => handleNavigation('NeighborConnections'),
      },
      {
        id: 'businesses',
        title: 'Local Businesses',
        subtitle: 'Find trusted services nearby',
        icon: 'store',
        iconColor: '#FF9800',
        onPress: () => handleNavigation('LocalBusinessDirectory'),
      },
    ],
  },

  // SECTION 3: Business (if user has business)
  {
    title: 'Business',
    items: [
      {
        id: 'business-profile',
        title: 'Business Profile',
        subtitle: 'Manage your business presence',
        icon: 'briefcase',
        iconColor: '#00A651',
        onPress: () => handleNavigation('BusinessProfile'),
      },
      // OR if no business:
      {
        id: 'business-register',
        title: 'Register Business',
        subtitle: 'Add your business to MeCabal',
        icon: 'store-plus',
        iconColor: '#00A651',
        onPress: () => handleNavigation('BusinessRegistration'),
      },
    ],
  },

  // SECTION 4: Settings
  {
    title: 'Settings',
    items: [
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Manage your alerts',
        icon: 'bell-cog',
        iconColor: '#FF6B35',
        onPress: () => handleNavigation('NotificationSettings'),
      },
      {
        id: 'privacy',
        title: 'Privacy & Safety',
        subtitle: 'Control your visibility',
        icon: 'shield-account',
        iconColor: '#2196F3',
        onPress: () => handleNavigation('PrivacySettings'),
      },
      {
        id: 'account-settings',
        title: 'Account Settings',
        subtitle: 'Manage your account',
        icon: 'cog',
        iconColor: '#8E8E93',
        onPress: () => handleNavigation('AccountSettings'),
      },
    ],
  },

  // SECTION 5: Support
  {
    title: 'Support & Info',
    items: [
      {
        id: 'help',
        title: 'Help Center',
        subtitle: 'Get help with MeCabal',
        icon: 'help-circle',
        iconColor: '#8E8E93',
        onPress: () => handleNavigation('HelpCenter'),
      },
      {
        id: 'about',
        title: 'About',
        subtitle: 'Version 1.0.0',
        icon: 'information',
        iconColor: '#8E8E93',
        onPress: () => handleNavigation('About'),
      },
    ],
  },

  // SECTION 6: Sign Out (separate, destructive)
  {
    title: '',  // No title
    items: [
      {
        id: 'signout',
        title: 'Sign Out',
        subtitle: '',
        icon: 'logout',
        iconColor: '#FF3B30',
        onPress: handleSignOut,
      },
    ],
  },
];
```

**Key Changes**:
- ✅ Dashboard added to Account section
- ✅ Community items consolidated
- ✅ Settings grouped together
- ✅ Support items at bottom
- ✅ Sign out separated as destructive action
- ✅ Removed duplicate items (badges, community activity)
- ✅ Removed dev tools

**Acceptance Criteria**:
- ✅ Sections in logical order
- ✅ Related items grouped together
- ✅ Most-used items near top
- ✅ Destructive action (sign out) at bottom
- ✅ No duplicate functionality
- ✅ All navigation works correctly

---

### Task 3.3: Update More Screen Styles
**Priority**: Low
**Estimated Time**: 30 minutes
**File**: `Hommie_Mobile/src/screens/MoreScreen.tsx`

**Apple Design Principle**: **Visual Design** - Clean, minimal, focus on content.

**Style Updates**:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',  // Apple's background
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 24,  // More space before sections
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  section: {
    marginBottom: 24,  // Increased spacing
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',  // Apple's secondary label
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',  // For separator lines
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,  // Ensure good touch target
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  separator: {
    height: 0.5,  // Hairline
    backgroundColor: '#E5E5EA',
    marginLeft: 60,  // Indent to align with text
  },
  // Destructive item (Sign Out)
  destructiveItem: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  destructiveText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
});
```

**Acceptance Criteria**:
- ✅ Apple-style colors and shadows
- ✅ Proper spacing (24px between sections)
- ✅ Hairline separators (0.5px)
- ✅ Destructive action styled distinctly
- ✅ Clean, minimal aesthetic

---

## PHASE 4: Simplify Home Sidebar

### Task 4.1: Reduce Sidebar Menu Items
**Priority**: Medium
**Estimated Time**: 30 minutes
**File**: `Hommie_Mobile/src/screens/HomeScreen.tsx`

**Apple Design Principle**: **Simplicity** - Sidebar is for quick navigation only, not a full menu system.

**Current Sidebar Menu** (lines 270-326):
```tsx
// TOO MANY ITEMS (currently 6 items):
- Personal Profile
- Business Profile
- Community Activity
- Neighbor Network
- Local Businesses
- Events
```

**New Sidebar Menu** (reduced to 4-5 essential items):
```tsx
<View style={styles.sidebarMenu}>
  {/* Profile */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => handleMenuItemPress(() => navigation.navigate('Profile'))}
  >
    <MaterialCommunityIcons name="account" size={24} color="#00A651" />
    <Text style={styles.menuItemText}>Profile</Text>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
  </TouchableOpacity>

  {/* Dashboard - NEW */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => handleMenuItemPress(() => navigation.navigate('Dashboard'))}
  >
    <MaterialCommunityIcons name="view-dashboard" size={24} color="#0066CC" />
    <Text style={styles.menuItemText}>Dashboard</Text>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
  </TouchableOpacity>

  {/* Events */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => handleMenuItemPress(() => navigation.navigate('Events'))}
  >
    <MaterialCommunityIcons name="calendar" size={24} color="#7B68EE" />
    <Text style={styles.menuItemText}>Events</Text>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
  </TouchableOpacity>

  {/* Messages - if exists */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => handleMenuItemPress(() => navigation.navigate('Messages'))}
  >
    <MaterialCommunityIcons name="message" size={24} color="#FF9800" />
    <Text style={styles.menuItemText}>Messages</Text>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
  </TouchableOpacity>

  {/* Divider */}
  <View style={styles.menuDivider} />

  {/* More (links to More screen) */}
  <TouchableOpacity
    style={styles.menuItem}
    onPress={() => handleMenuItemPress(() => navigation.navigate('More'))}
  >
    <MaterialCommunityIcons name="dots-horizontal-circle" size={24} color="#8E8E93" />
    <Text style={styles.menuItemText}>More</Text>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
  </TouchableOpacity>
</View>
```

**Items REMOVED**:
- ❌ Business Profile (access via More → Business)
- ❌ Community Activity (access via More → Community)
- ❌ Neighbor Network (access via More → Community)
- ❌ Local Businesses (access via More → Community)

**Items KEPT**:
- ✅ Profile (most accessed)
- ✅ Dashboard (new, frequently accessed)
- ✅ Events (popular feature)
- ✅ Messages (if exists - core communication)
- ✅ More (gateway to all other features)

**Acceptance Criteria**:
- ✅ Sidebar has maximum 5 items
- ✅ Dashboard added
- ✅ Duplicate items removed
- ✅ "More" link added for additional features
- ✅ Clean, focused menu

---

### Task 4.2: Update Sidebar Footer
**Priority**: Low
**Estimated Time**: 15 minutes
**File**: `Hommie_Mobile/src/screens/HomeScreen.tsx`

**Current Footer** (lines 328-338):
```tsx
<View style={styles.sidebarFooter}>
  <TouchableOpacity style={styles.footerButton}>
    <MaterialCommunityIcons name="cog" size={20} color="#8E8E8E" />
    <Text style={styles.footerButtonText}>Settings</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.footerButton}>
    <MaterialCommunityIcons name="help-circle" size={20} color="#8E8E8E" />
    <Text style={styles.footerButtonText}>Help</Text>
  </TouchableOpacity>
</View>
```

**New Footer** (simplified):
```tsx
<View style={styles.sidebarFooter}>
  <TouchableOpacity
    style={styles.footerButton}
    onPress={() => handleMenuItemPress(() => navigation.navigate('More'))}
  >
    <MaterialCommunityIcons name="dots-horizontal-circle" size={20} color="#8E8E93" />
    <Text style={styles.footerButtonText}>Settings & More</Text>
  </TouchableOpacity>
</View>
```

**Rationale**:
- Settings and Help both accessible via More screen
- Single "More" link is cleaner
- Reduces cognitive load

**Acceptance Criteria**:
- ✅ Footer simplified to single "More" button
- ✅ Button navigates to More screen
- ✅ Consistent with Apple's approach (minimal sidebars)

---

## PHASE 5: Polish & Apple-ify

### Task 5.1: Implement Haptic Feedback
**Priority**: Low
**Estimated Time**: 1 hour
**Files**: All screen files

**Apple Design Principle**: **Feedback** - Physical feedback enhances user experience.

**Implementation**:

1. **Install Haptics** (if not already):
```bash
expo install expo-haptics
```

2. **Create Haptics Utility**:
```tsx
// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';

export const HapticFeedback = {
  // Light tap (for buttons, switches)
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Medium tap (for selections)
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Heavy tap (for important actions)
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  // Success feedback
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Warning feedback
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // Error feedback
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Selection changed (for pickers, sliders)
  selection: () => {
    Haptics.selectionAsync();
  },
};
```

3. **Apply to Interactive Elements**:

```tsx
// Profile Screen - Edit button
<TouchableOpacity
  style={styles.editProfileButton}
  onPress={() => {
    HapticFeedback.light();
    navigation.navigate('EditProfile');
  }}
>
  {/* ... */}
</TouchableOpacity>

// Dashboard Screen - Card taps
<TouchableOpacity
  style={styles.gridCard}
  onPress={() => {
    HapticFeedback.medium();
    navigation.navigate('Bookmarks', { type: 'post' });
  }}
>
  {/* ... */}
</TouchableOpacity>

// More Screen - Sign Out (destructive)
<TouchableOpacity
  onPress={() => {
    HapticFeedback.warning();
    handleSignOut();
  }}
>
  {/* ... */}
</TouchableOpacity>

// Success actions (after save, etc)
const handleSave = async () => {
  try {
    await saveProfile();
    HapticFeedback.success();
    Alert.alert('Success', 'Profile updated!');
  } catch (error) {
    HapticFeedback.error();
    Alert.alert('Error', 'Failed to save');
  }
};
```

**When to Use Each Type**:
- **Light**: Regular buttons, tabs, switches
- **Medium**: Cards, list items, selections
- **Heavy**: Important actions (submit, save)
- **Success**: Successful operations
- **Warning**: Caution needed (delete, sign out)
- **Error**: Failed operations
- **Selection**: Picker changes, slider movements

**Acceptance Criteria**:
- ✅ Haptic utility created and working
- ✅ All interactive elements have appropriate feedback
- ✅ Light feedback for regular taps
- ✅ Medium feedback for card/list taps
- ✅ Success/error feedback for operations
- ✅ Warning feedback for destructive actions
- ✅ Feels natural and "Apple-like"

---

### Task 5.2: Add Smooth Animations
**Priority**: Medium
**Estimated Time**: 2 hours
**Files**: ProfileScreen, DashboardScreen, MoreScreen

**Apple Design Principle**: **Motion** - Beautiful, fluid motion brings the interface to life.

**Implementation**:

1. **Card Entrance Animations** (Profile/Dashboard screens):

```tsx
import { Animated } from 'react-native';

const ProfileScreen = () => {
  // Animated values for card entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Staggered animation for cards
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {/* Card content */}
    </Animated.View>
  );
};
```

2. **Button Press Animations**:

```tsx
const AnimatedButton = ({ children, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};
```

3. **List Item Animations** (Dashboard/More screens):

```tsx
const AnimatedListItem = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,  // Staggered
      useNativeDriver: true,
    }).start();

    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 7,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      {/* List item content */}
    </Animated.View>
  );
};
```

4. **Modal/Sheet Animations** (Sidebar):

```tsx
// For sidebar slide-in
<Modal
  visible={sidebarVisible}
  transparent
  animationType="none"  // Use custom animation
  onRequestClose={closeSidebar}
>
  <Animated.View
    style={{
      ...styles.sidebarOverlay,
      opacity: backdropAnim,
    }}
  >
    <Animated.View
      style={{
        ...styles.sidebar,
        transform: [{ translateX: sidebarAnim }],
      }}
    >
      {/* Sidebar content */}
    </Animated.View>
  </Animated.View>
</Modal>
```

**Animation Timing Guidelines**:
- **Micro-interactions** (buttons): 150-300ms
- **Card animations**: 300-400ms
- **Screen transitions**: 400-500ms
- **Complex animations**: 500-700ms
- Use **spring** for natural feel
- Use **easing** curves: `easeOut` for entrances, `easeIn` for exits

**Acceptance Criteria**:
- ✅ Cards fade and slide in on screen load
- ✅ Buttons have subtle scale animation on press
- ✅ List items animate in with stagger effect
- ✅ Sidebar slides in smoothly
- ✅ All animations use native driver
- ✅ Animations feel smooth (60fps)
- ✅ No janky or laggy animations

---

### Task 5.3: Implement Pull-to-Refresh Consistently
**Priority**: Medium
**Estimated Time**: 30 minutes
**Files**: ProfileScreen, DashboardScreen

**Apple Design Principle**: **Consistency** - Similar gestures work the same way across app.

**Implementation**:

```tsx
// ProfileScreen.tsx and DashboardScreen.tsx
const [refreshing, setRefreshing] = useState(false);

const handleRefresh = async () => {
  setRefreshing(true);
  HapticFeedback.medium();  // Haptic feedback on refresh

  try {
    await Promise.all([
      refreshProfile(),
      refreshTrustScore(),
      refreshDashboard(),
    ]);
    HapticFeedback.success();
  } catch (error) {
    HapticFeedback.error();
  } finally {
    setRefreshing(false);
  }
};

<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor="#00A651"  // Brand color
      titleColor="#8E8E93"  // Apple's secondary label
      title="Pull to refresh"  // iOS only
    />
  }
>
  {/* Content */}
</ScrollView>
```

**Acceptance Criteria**:
- ✅ Pull-to-refresh works on Profile screen
- ✅ Pull-to-refresh works on Dashboard screen
- ✅ Consistent brand color (#00A651)
- ✅ Haptic feedback on refresh
- ✅ Success/error haptic after refresh
- ✅ Smooth animation

---

### Task 5.4: Add Loading States (Apple-style)
**Priority**: Medium
**Estimated Time**: 1.5 hours
**Files**: All screens

**Apple Design Principle**: **Deference** - Loading indicators shouldn't distract from content.

**Implementation**:

1. **Skeleton Placeholders** (better than spinners):

```tsx
// Update SkeletonPlaceholder component
import { Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const SkeletonPlaceholder = ({ width, height, borderRadius, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius || 8,
          backgroundColor: '#E5E5EA',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['#E5E5EA', '#F2F2F7', '#E5E5EA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};
```

2. **Use Skeletons in Screens**:

```tsx
// Dashboard Screen - Loading state
{loading ? (
  <>
    <View style={styles.gridContainer}>
      <SkeletonPlaceholder width="48%" height={140} borderRadius={16} />
      <SkeletonPlaceholder width="48%" height={140} borderRadius={16} />
    </View>
    <SkeletonPlaceholder width="100%" height={80} borderRadius={12} style={{ marginTop: 16 }} />
    <SkeletonPlaceholder width="100%" height={80} borderRadius={12} style={{ marginTop: 8 }} />
  </>
) : (
  // Actual content
)}
```

3. **Minimal Spinners** (when needed):

```tsx
import { ActivityIndicator } from 'react-native';

// Use Apple's style
<ActivityIndicator
  size="small"
  color="#8E8E93"  // Subtle, not distracting
/>
```

**Acceptance Criteria**:
- ✅ Skeleton placeholders match content shape
- ✅ Smooth shimmer animation
- ✅ Skeletons used for cards and lists
- ✅ Minimal spinners only when necessary
- ✅ Loading states don't distract from UI
- ✅ Consistent across all screens

---

### Task 5.5: Improve Typography (Apple-style)
**Priority**: Low
**Estimated Time**: 1 hour
**Files**: All screens

**Apple Design Principle**: **Legibility** - Text should be crisp and easy to read at every size.

**Typography Scale** (based on Apple's HIG):

```tsx
// Create typography constants
// src/constants/typography.ts
export const Typography = {
  // Display (Large titles)
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 41,
  },

  // Titles
  title1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 25,
  },

  // Body
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  bodyEmphasized: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 22,
  },

  // Callout
  callout: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.3,
    lineHeight: 21,
  },

  // Subheadline
  subheadline: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  subheadlineEmphasized: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
  },

  // Footnote
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 18,
  },
  footnoteEmphasized: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    lineHeight: 18,
  },

  // Caption
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 16,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0,
    lineHeight: 13,
  },
};
```

**Apply to Screens**:

```tsx
// Profile Screen
const styles = StyleSheet.create({
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  sectionTitle: {
    ...Typography.title3,
  },
  enhancementSubtitle: {
    ...Typography.subheadline,
    color: '#8E8E93',
  },
  privacyText: {
    ...Typography.footnote,
    color: '#8E8E93',
  },
});
```

**Acceptance Criteria**:
- ✅ Typography constants created
- ✅ All screens use typography scale
- ✅ Proper letter spacing applied
- ✅ Line heights set for readability
- ✅ Consistent hierarchy across app
- ✅ Text is crisp and readable

---

## Testing & QA Checklist

### Functionality Testing
- [ ] Profile screen displays correct user info
- [ ] Trust Score Card shows accurate data in compact mode
- [ ] Dashboard Stats Card shows accurate data in compact mode
- [ ] Tap on compact cards navigates to Dashboard screen
- [ ] Dashboard screen shows all saved items correctly
- [ ] Events section in Dashboard displays correctly
- [ ] Community activity stats are accurate
- [ ] Quick actions in Dashboard work
- [ ] More screen has all settings and options
- [ ] More screen navigation works correctly
- [ ] Home sidebar has reduced, focused menu
- [ ] All navigation paths work correctly
- [ ] Pull-to-refresh works on all screens
- [ ] Loading states display correctly
- [ ] Error states display correctly

### Visual Design Testing
- [ ] All cards have Apple-style shadows (0.04-0.10 opacity)
- [ ] Typography uses correct sizes and letter spacing
- [ ] Colors match Apple's system palette
- [ ] Spacing follows 8pt grid system
- [ ] Border radius consistent (16 for cards, 12 for buttons)
- [ ] All touch targets minimum 44pt
- [ ] No duplicate information visible
- [ ] Sections have proper breathing room
- [ ] Overall aesthetic feels "Apple-like"

### Animation & Interaction Testing
- [ ] Cards fade and slide in on screen load
- [ ] Button press animations work smoothly
- [ ] List items animate with stagger effect
- [ ] Sidebar slides in smoothly
- [ ] All animations run at 60fps (no jank)
- [ ] Haptic feedback works on all interactions
- [ ] Pull-to-refresh has haptic feedback
- [ ] Success/error operations have haptic feedback

### Cross-Platform Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on different screen sizes
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test on web (if applicable)

### Performance Testing
- [ ] Screen transitions are smooth
- [ ] Scrolling is smooth (no lag)
- [ ] Pull-to-refresh doesn't cause jank
- [ ] Animations don't cause frame drops
- [ ] Loading states appear quickly
- [ ] Data fetching doesn't block UI

---

## Implementation Timeline

### Week 1: Core Restructuring
- **Day 1-2**: Phase 1 (Tasks 1.1-1.4) - Clean up Profile screen
- **Day 3**: Phase 1 (Tasks 1.5-1.7) - Reorganize and style Profile
- **Day 4-5**: Phase 2 - Create Dashboard screen

### Week 2: Refactoring & Polish
- **Day 1-2**: Phase 3 - Refactor More screen
- **Day 3**: Phase 4 - Simplify Home sidebar
- **Day 4**: Phase 5 (Tasks 5.1-5.3) - Haptics, animations, refresh
- **Day 5**: Phase 5 (Tasks 5.4-5.5) - Loading states, typography

### Week 3: Testing & Refinement
- **Day 1-2**: Comprehensive testing (functionality, visual, interaction)
- **Day 3-4**: Bug fixes and refinements
- **Day 5**: Final QA and polish

**Total Estimated Time**: 15-20 development days

---

## Developer Resources

### Apple HIG References
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
- [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)
- [Navigation](https://developer.apple.com/design/human-interface-guidelines/navigation)

### React Native Resources
- [Animated API](https://reactnative.dev/docs/animated)
- [Haptic Feedback](https://docs.expo.dev/versions/latest/sdk/haptics/)
- [RefreshControl](https://reactnative.dev/docs/refreshcontrol)

### Design Tools
- [SF Symbols](https://developer.apple.com/sf-symbols/) - Icon reference
- [iOS Design Kit](https://developer.apple.com/design/resources/) - Figma/Sketch resources

---

## Success Metrics

### User Experience
- ✅ Users can find information 30% faster
- ✅ Navigation paths reduced by 40%
- ✅ Duplicate information eliminated (100%)
- ✅ Screen load times feel instant (<100ms)

### Design Quality
- ✅ 95%+ adherence to Apple design guidelines
- ✅ Consistent spacing throughout (8pt grid)
- ✅ All animations run at 60fps
- ✅ No visual bugs or inconsistencies

### Development Quality
- ✅ Zero duplicate code
- ✅ Reusable components created
- ✅ Clean separation of concerns
- ✅ Maintainable codebase

---

## Notes for Developers

1. **Start with Phase 1** - Clean up Profile screen first, as it has the most severe issues.

2. **Test after each task** - Don't accumulate changes. Test each task before moving to the next.

3. **Use version control** - Commit after each completed task with descriptive messages.

4. **Keep user experience in mind** - If something feels wrong, refer back to Apple's HIG.

5. **Don't skip polish phase** - Animations and haptics make the difference between "good" and "Apple-quality".

6. **Ask questions early** - If unclear about any task, ask before implementing.

7. **Document as you go** - Add comments for complex logic, update README if needed.

8. **Performance matters** - Always use `useNativeDriver: true` for animations.

9. **Accessibility counts** - Ensure minimum 44pt touch targets, proper contrast ratios.

10. **Consistency is key** - Use shared constants for colors, spacing, typography.

---

**End of Implementation Plan**
