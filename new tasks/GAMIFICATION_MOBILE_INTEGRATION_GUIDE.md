# Gamification & Leaderboard Mobile Integration Guide
**MeCabal - Mobile App Integration for Gamification System**
*Following Apple Human Interface Guidelines & iOS Design Principles*

---

## Table of Contents
1. [Integration Overview](#integration-overview)
2. [Gap Analysis](#gap-analysis)
3. [API Service Layer](#api-service-layer)
4. [State Management](#state-management)
5. [UI Components](#ui-components)
6. [Screen Implementations](#screen-implementations)
7. [Real-time Updates](#real-time-updates)
8. [Notifications](#notifications)
9. [Testing Strategy](#testing-strategy)
10. [Implementation Timeline](#implementation-timeline)

---

## Integration Overview

### Current State
**Backend (✅ Completed):**
- 7 database tables with complete schema
- 5 services (Achievements, Badges, Points, Leaderboard, Integration)
- 20+ REST API endpoints with Swagger documentation
- Event-driven architecture for cross-service communication
- CRON jobs for periodic point resets and leaderboard snapshots

**Mobile App (⚠️ Partial):**
- Static gamification data in `constants/gamificationData.ts`
- UI components: `BadgeSystemComponent.tsx`, `BadgeSystemScreen.tsx`
- Mock data implementation with hardcoded values
- No API integration or state management
- No real-time updates

### Integration Goals
1. Connect mobile app to backend gamification APIs
2. Implement proper state management for gamification data
3. Add real-time updates for achievements and badges
4. Create push notifications for gamification events
5. Follow Apple HIG for iOS design patterns
6. Ensure smooth animations and transitions
7. Implement offline-first capability

---

## Gap Analysis

### 1. API Service Layer ❌ MISSING
**What's Needed:**
- `GamificationService.ts` - API client for all gamification endpoints
- `AchievementsService.ts` - Achievements-specific operations
- `BadgesService.ts` - Badge management operations
- `PointsService.ts` - Points tracking operations
- `LeaderboardService.ts` - Leaderboard queries
- Error handling and retry logic
- Request/response type definitions
- Authentication token management

### 2. State Management ❌ MISSING
**What's Needed:**
- Context API or Redux for gamification state
- User points and level tracking
- Achievement progress tracking
- Badge collection state
- Leaderboard rankings cache
- Optimistic updates for better UX
- Offline queue for pending actions

### 3. Real-time Updates ❌ MISSING
**What's Needed:**
- WebSocket connection for live updates
- Achievement unlock notifications
- Badge award notifications
- Points earned notifications
- Leaderboard position changes
- Live activity feed (iOS 16.1+)

### 4. Screen Integration ⚠️ PARTIAL
**Current Issues:**
- Screens use mock/hardcoded data
- No API calls to backend
- No loading states
- No error handling
- No pull-to-refresh
- Static progress bars

**What's Needed:**
- Connect existing screens to API
- Add loading skeletons
- Implement error states
- Add pull-to-refresh
- Dynamic data updates
- Proper navigation flow

### 5. Notifications ❌ MISSING
**What's Needed:**
- Push notification setup
- Achievement unlock alerts
- Badge earned alerts
- Level up celebrations
- Leaderboard position alerts
- Daily/weekly recap notifications
- Rich notification UI (iOS)

### 6. Apple HIG Compliance ⚠️ PARTIAL
**Current Issues:**
- Some components don't follow iOS patterns
- Missing haptic feedback
- Inconsistent navigation patterns
- No SF Symbols integration
- Missing accessibility features

**What's Needed:**
- SF Symbols instead of Material Icons where appropriate
- Haptic feedback for interactions
- iOS-style navigation
- VoiceOver support
- Dynamic Type support
- Dark mode support

---

## API Service Layer

### Task 3.1: Create Base Gamification Service
**File:** `Hommie_Mobile/src/services/GamificationService.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

// ==================== Types ====================
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'community' | 'safety' | 'social' | 'business' | 'events' | 'leadership';
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: string;
    count: number;
    description: string;
  };
  progress?: number;
  isUnlocked?: boolean;
  unlockedAt?: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: 'verified' | 'contribution' | 'leadership' | 'safety' | 'social' | 'business';
  requirementsText: string;
  requirementsConfig?: any;
  isActive: boolean;
  earnedAt?: Date;
  isClaimed?: boolean;
  isDisplayed?: boolean;
}

export interface UserPoints {
  userId: string;
  totalPoints: number;
  level: number;
  levelName: string;
  rank?: number;
  dailyPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  streakDays: number;
  lastActivityAt?: Date;
}

export interface LeaderboardEntry {
  userId: string;
  rank: number;
  points: number;
  change: number;
  user?: {
    firstName: string;
    lastName: string;
    avatar?: string;
    verificationBadge?: string;
  };
}

export interface LeaderboardResponse {
  rankings: LeaderboardEntry[];
  userRank?: LeaderboardEntry;
  totalParticipants: number;
}

export interface GamificationDashboard {
  points: UserPoints;
  achievements: {
    list: Achievement[];
    stats: {
      total: number;
      unlocked: number;
      locked: number;
      completionPercentage: number;
      byCategory: Array<{ category: string; count: number }>;
    };
  };
  badges: Badge[];
  leaderboard: {
    topRankings: LeaderboardEntry[];
    userRank?: LeaderboardEntry;
  };
}

export enum LeaderboardCategory {
  OVERALL = 'overall',
  SAFETY = 'safety',
  EVENTS = 'events',
  HELPFUL = 'helpful',
  BUSINESS = 'business',
}

export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all-time',
}

// ==================== API Client ====================
class GamificationService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL || 'http://localhost:3000';
  }

  // ==================== Authentication ====================
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async getAuthToken(): Promise<string | null> {
    if (this.authToken) return this.authToken;
    this.authToken = await AsyncStorage.getItem('auth_token');
    return this.authToken;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // ==================== API Request Handler ====================
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.baseUrl}${endpoint}`;

      console.log(`[API] ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true, data };
    } catch (error) {
      console.error('[API Error]', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  // ==================== Dashboard ====================
  async getDashboard(): Promise<{ success: boolean; data?: GamificationDashboard; error?: string }> {
    return this.request<GamificationDashboard>('/gamification/dashboard');
  }

  // ==================== Achievements ====================
  async getAllAchievements(
    category?: Achievement['category']
  ): Promise<{ success: boolean; data?: Achievement[]; error?: string }> {
    const query = category ? `?category=${category}` : '';
    return this.request<Achievement[]>(`/achievements${query}`);
  }

  async getUserAchievements(
    category?: Achievement['category']
  ): Promise<{ success: boolean; data?: Achievement[]; error?: string }> {
    const query = category ? `?category=${category}` : '';
    return this.request<Achievement[]>(`/achievements/my${query}`);
  }

  async getAchievementStats(): Promise<{
    success: boolean;
    data?: {
      total: number;
      unlocked: number;
      locked: number;
      completionPercentage: number;
      byCategory: Array<{ category: string; count: number }>;
    };
    error?: string;
  }> {
    return this.request('/achievements/stats');
  }

  // ==================== Badges ====================
  async getAllBadges(
    type?: Badge['type']
  ): Promise<{ success: boolean; data?: Badge[]; error?: string }> {
    const query = type ? `?type=${type}` : '';
    return this.request<Badge[]>(`/badges${query}`);
  }

  async getUserBadges(): Promise<{ success: boolean; data?: Badge[]; error?: string }> {
    return this.request<Badge[]>('/badges/my');
  }

  async claimBadge(badgeId: string): Promise<{ success: boolean; data?: Badge; error?: string }> {
    return this.request<Badge>(`/badges/my/${badgeId}/claim`, {
      method: 'POST',
    });
  }

  async toggleBadgeVisibility(
    badgeId: string
  ): Promise<{ success: boolean; data?: Badge; error?: string }> {
    return this.request<Badge>(`/badges/my/${badgeId}/toggle-visibility`, {
      method: 'POST',
    });
  }

  async checkBadgeEligibility(): Promise<{ success: boolean; data?: Badge[]; error?: string }> {
    return this.request<Badge[]>('/badges/check-eligibility', {
      method: 'POST',
    });
  }

  // ==================== Points ====================
  async getUserPoints(): Promise<{ success: boolean; data?: UserPoints; error?: string }> {
    return this.request<UserPoints>('/points/my');
  }

  async getActivityHistory(): Promise<{
    success: boolean;
    data?: Array<{
      activityType: string;
      pointsEarned: number;
      createdAt: Date;
      metadata?: any;
    }>;
    error?: string;
  }> {
    return this.request('/points/activity-history');
  }

  // ==================== Leaderboard ====================
  async getLeaderboard(
    category: LeaderboardCategory = LeaderboardCategory.OVERALL,
    period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME,
    limit: number = 100
  ): Promise<{ success: boolean; data?: LeaderboardResponse; error?: string }> {
    const query = `?category=${category}&period=${period}&limit=${limit}`;
    return this.request<LeaderboardResponse>(`/leaderboard${query}`);
  }
}

export default new GamificationService();
```

**Verification Checklist:**
- [ ] Service file created
- [ ] All types defined matching backend DTOs
- [ ] Authentication token management implemented
- [ ] Error handling implemented
- [ ] All API endpoints covered
- [ ] TypeScript types exported

---

### Task 3.2: Add Service to Main Exports
**File:** `Hommie_Mobile/src/services/index.ts`

**Add to exports:**
```typescript
// Gamification services
export { default as GamificationService } from './GamificationService';
export type {
  Achievement,
  Badge,
  UserPoints,
  LeaderboardEntry,
  LeaderboardResponse,
  GamificationDashboard,
  LeaderboardCategory,
  LeaderboardPeriod,
} from './GamificationService';
```

**Verification Checklist:**
- [ ] Service exported in index.ts
- [ ] Types exported
- [ ] No import errors

---

## State Management

### Task 3.3: Create Gamification Context
**File:** `Hommie_Mobile/src/contexts/GamificationContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import GamificationService, {
  Achievement,
  Badge,
  UserPoints,
  LeaderboardEntry,
  GamificationDashboard,
  LeaderboardCategory,
  LeaderboardPeriod,
} from '../services/GamificationService';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

// ==================== Context Types ====================
interface GamificationContextType {
  // State
  dashboard: GamificationDashboard | null;
  userPoints: UserPoints | null;
  achievements: Achievement[];
  badges: Badge[];
  leaderboard: LeaderboardEntry[];
  userRank: LeaderboardEntry | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Actions
  refreshDashboard: () => Promise<void>;
  refreshAchievements: (category?: Achievement['category']) => Promise<void>;
  refreshBadges: (type?: Badge['type']) => Promise<void>;
  refreshLeaderboard: (
    category?: LeaderboardCategory,
    period?: LeaderboardPeriod
  ) => Promise<void>;
  claimBadge: (badgeId: string) => Promise<boolean>;
  toggleBadgeVisibility: (badgeId: string) => Promise<boolean>;

  // Notifications
  showAchievementUnlocked: (achievement: Achievement) => void;
  showBadgeEarned: (badge: Badge) => void;
  showLevelUp: (newLevel: number, levelName: string) => void;
}

// ==================== Context Creation ====================
const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

// ==================== Provider Component ====================
export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [dashboard, setDashboard] = useState<GamificationDashboard | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Previous level tracking for level-up detection
  const previousLevel = useRef<number | null>(null);

  // ==================== Dashboard ====================
  const refreshDashboard = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await GamificationService.getDashboard();

      if (response.success && response.data) {
        setDashboard(response.data);
        setUserPoints(response.data.points);
        setAchievements(response.data.achievements.list);
        setBadges(response.data.badges);
        setLeaderboard(response.data.leaderboard.topRankings);
        setUserRank(response.data.leaderboard.userRank || null);

        // Check for level up
        if (
          previousLevel.current !== null &&
          response.data.points.level > previousLevel.current
        ) {
          showLevelUp(response.data.points.level, response.data.points.levelName);
        }
        previousLevel.current = response.data.points.level;
      } else {
        console.error('[Gamification] Dashboard fetch failed:', response.error);
      }
    } catch (error) {
      console.error('[Gamification] Dashboard error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ==================== Achievements ====================
  const refreshAchievements = useCallback(async (category?: Achievement['category']) => {
    try {
      const response = await GamificationService.getUserAchievements(category);
      if (response.success && response.data) {
        setAchievements(response.data);
      }
    } catch (error) {
      console.error('[Gamification] Achievements error:', error);
    }
  }, []);

  // ==================== Badges ====================
  const refreshBadges = useCallback(async (type?: Badge['type']) => {
    try {
      const response = await GamificationService.getUserBadges();
      if (response.success && response.data) {
        setBadges(response.data);
      }
    } catch (error) {
      console.error('[Gamification] Badges error:', error);
    }
  }, []);

  const claimBadge = useCallback(async (badgeId: string): Promise<boolean> => {
    try {
      const response = await GamificationService.claimBadge(badgeId);
      if (response.success && response.data) {
        // Update local state
        setBadges((prev) =>
          prev.map((badge) =>
            badge.id === badgeId ? { ...badge, isClaimed: true, claimedAt: new Date() } : badge
          )
        );

        // Haptic feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show success message
        Alert.alert('Badge Claimed!', `You've claimed the "${response.data.name}" badge!`);

        return true;
      }
      return false;
    } catch (error) {
      console.error('[Gamification] Claim badge error:', error);
      return false;
    }
  }, []);

  const toggleBadgeVisibility = useCallback(async (badgeId: string): Promise<boolean> => {
    try {
      const response = await GamificationService.toggleBadgeVisibility(badgeId);
      if (response.success && response.data) {
        setBadges((prev) =>
          prev.map((badge) =>
            badge.id === badgeId ? { ...badge, isDisplayed: response.data!.isDisplayed } : badge
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Gamification] Toggle badge visibility error:', error);
      return false;
    }
  }, []);

  // ==================== Leaderboard ====================
  const refreshLeaderboard = useCallback(
    async (
      category: LeaderboardCategory = LeaderboardCategory.OVERALL,
      period: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME
    ) => {
      try {
        const response = await GamificationService.getLeaderboard(category, period, 100);
        if (response.success && response.data) {
          setLeaderboard(response.data.rankings);
          setUserRank(response.data.userRank || null);
        }
      } catch (error) {
        console.error('[Gamification] Leaderboard error:', error);
      }
    },
    []
  );

  // ==================== Notifications ====================
  const showAchievementUnlocked = useCallback((achievement: Achievement) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      '🏆 Achievement Unlocked!',
      `You've earned "${achievement.name}"!\n\n${achievement.description}\n\n+${achievement.points} points`,
      [{ text: 'Awesome!', style: 'default' }]
    );
  }, []);

  const showBadgeEarned = useCallback((badge: Badge) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      '🎖️ Badge Earned!',
      `You've earned the "${badge.name}" badge!\n\n${badge.description}`,
      [
        { text: 'View Badge', style: 'default' },
        { text: 'Later', style: 'cancel' },
      ]
    );
  }, []);

  const showLevelUp = useCallback((newLevel: number, levelName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      '⭐ Level Up!',
      `Congratulations! You've reached Level ${newLevel}!\n\nYou are now a "${levelName}"`,
      [{ text: 'Amazing!', style: 'default' }]
    );
  }, []);

  // ==================== Initial Load ====================
  useEffect(() => {
    const initializeGamification = async () => {
      setIsLoading(true);
      await refreshDashboard();
      setIsLoading(false);
    };

    initializeGamification();
  }, [refreshDashboard]);

  // ==================== Context Value ====================
  const value: GamificationContextType = {
    dashboard,
    userPoints,
    achievements,
    badges,
    leaderboard,
    userRank,
    isLoading,
    isRefreshing,
    refreshDashboard,
    refreshAchievements,
    refreshBadges,
    refreshLeaderboard,
    claimBadge,
    toggleBadgeVisibility,
    showAchievementUnlocked,
    showBadgeEarned,
    showLevelUp,
  };

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
};

// ==================== Hook ====================
export const useGamification = (): GamificationContextType => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};
```

**Verification Checklist:**
- [ ] Context created with all necessary state
- [ ] Provider component implemented
- [ ] Custom hook exported
- [ ] Haptic feedback integrated
- [ ] Alert notifications implemented
- [ ] Level-up detection working

---

### Task 3.4: Add Provider to App Root
**File:** `Hommie_Mobile/App.tsx`

**Wrap app with GamificationProvider:**
```typescript
import { GamificationProvider } from './src/contexts/GamificationContext';

export default function App() {
  return (
    <GamificationProvider>
      {/* Existing app structure */}
    </GamificationProvider>
  );
}
```

**Verification Checklist:**
- [ ] Provider added to app root
- [ ] Context available throughout app
- [ ] No initialization errors

---

## UI Components

### Task 3.5: Update Badge System Component
**File:** `Hommie_Mobile/src/components/BadgeSystemComponent.tsx`

**Replace mock data with real API data:**
```typescript
import React, { useEffect } from 'react';
import { useGamification } from '../contexts/GamificationContext';
import { ActivityIndicator, RefreshControl, ScrollView } from 'react-native';

export default function BadgeSystemComponent({
  compactMode = false,
  showCategories = true,
  maxDisplay = 6,
  onBadgePress
}: BadgeSystemProps) {
  const {
    badges,
    isLoading,
    isRefreshing,
    refreshBadges,
    claimBadge,
    toggleBadgeVisibility,
  } = useGamification();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Load badges on mount
  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  // Handle badge claim
  const handleClaimBadge = async (badge: Badge) => {
    const success = await claimBadge(badge.id);
    if (success) {
      setShowBadgeModal(false);
      // Refresh badges to get updated state
      refreshBadges();
    }
  };

  // Show loading state
  if (isLoading && badges.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A651" />
        <Text style={styles.loadingText}>Loading badges...</Text>
      </View>
    );
  }

  // Rest of component implementation...
  // Replace userBadges with real badges from context
  // Replace mock progress calculations with real data
  // Add pull-to-refresh support
}
```

**Key Changes:**
- Replace all mock data with context data
- Add loading states
- Add error states
- Add pull-to-refresh
- Connect claim badge to API
- Connect toggle visibility to API
- Remove hardcoded progress calculations

**Verification Checklist:**
- [ ] Component uses real API data
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Pull-to-refresh working
- [ ] Badge claiming functional
- [ ] Visibility toggle functional

---

### Task 3.6: Create Achievement Card Component
**File:** `Hommie_Mobile/src/components/AchievementCard.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Achievement } from '../services/GamificationService';
import * as Haptics from 'expo-haptics';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  size?: 'small' | 'medium' | 'large';
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  size = 'medium',
}) => {
  const isUnlocked = achievement.isUnlocked || false;
  const progress = achievement.progress || 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(achievement);
  };

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    const colors = {
      common: '#8E8E8E',
      uncommon: '#00A651',
      rare: '#0066CC',
      epic: '#7B68EE',
      legendary: '#FFD700',
    };
    return colors[rarity];
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        styles[`${size}Container`],
        !isUnlocked && styles.lockedContainer,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: isUnlocked ? achievement.color + '20' : '#F5F5F5' },
        ]}
      >
        <MaterialCommunityIcons
          name={achievement.icon as any}
          size={size === 'small' ? 24 : size === 'medium' ? 32 : 40}
          color={isUnlocked ? achievement.color : '#C0C0C0'}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[styles.name, !isUnlocked && styles.lockedName]}
            numberOfLines={1}
          >
            {achievement.name}
          </Text>
          <View
            style={[
              styles.rarityBadge,
              { backgroundColor: getRarityColor(achievement.rarity) },
            ]}
          >
            <Text style={styles.rarityText}>{achievement.rarity}</Text>
          </View>
        </View>

        <Text
          style={[styles.description, !isUnlocked && styles.lockedDescription]}
          numberOfLines={2}
        >
          {achievement.description}
        </Text>

        {/* Progress Bar */}
        {!isUnlocked && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: achievement.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}

        {/* Points */}
        <View style={styles.footer}>
          <View style={styles.pointsContainer}>
            <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
            <Text style={styles.points}>+{achievement.points}</Text>
          </View>

          {isUnlocked && (
            <View style={styles.unlockedIndicator}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#00A651" />
              <Text style={styles.unlockedText}>Unlocked</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12,
  },
  smallContainer: {
    padding: 8,
  },
  mediumContainer: {
    padding: 12,
  },
  largeContainer: {
    padding: 16,
  },
  lockedContainer: {
    opacity: 0.7,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    flex: 1,
  },
  lockedName: {
    color: '#8E8E8E',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 18,
    marginBottom: 8,
  },
  lockedDescription: {
    color: '#C0C0C0',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E8E',
    minWidth: 40,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  points: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFC107',
    marginLeft: 4,
  },
  unlockedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A651',
    marginLeft: 4,
  },
});
```

**Verification Checklist:**
- [ ] Component renders correctly
- [ ] Haptic feedback working
- [ ] Progress bar displays correctly
- [ ] Rarity colors correct
- [ ] Locked/unlocked states correct
- [ ] All sizes (small/medium/large) working

---

### Task 3.7: Create Leaderboard Card Component
**File:** `Hommie_Mobile/src/components/LeaderboardCard.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LeaderboardEntry } from '../services/GamificationService';
import * as Haptics from 'expo-haptics';

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
  onPress?: (entry: LeaderboardEntry) => void;
}

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  entry,
  isCurrentUser = false,
  onPress,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.(entry);
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#8E8E8E';
  };

  const getChangeIcon = (change: number): string => {
    if (change > 0) return 'arrow-up';
    if (change < 0) return 'arrow-down';
    return 'minus';
  };

  const getChangeColor = (change: number): string => {
    if (change > 0) return '#00A651';
    if (change < 0) return '#E74C3C';
    return '#8E8E8E';
  };

  return (
    <TouchableOpacity
      style={[styles.container, isCurrentUser && styles.currentUserContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Rank */}
      <View style={[styles.rankContainer, { backgroundColor: getRankColor(entry.rank) + '20' }]}>
        <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
          {entry.rank <= 3 ? getRankIcon(entry.rank) : getRankIcon(entry.rank)}
        </Text>
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        {entry.user?.avatar ? (
          <Image source={{ uri: entry.user.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialCommunityIcons name="account" size={24} color="#8E8E8E" />
          </View>
        )}

        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, isCurrentUser && styles.currentUserName]} numberOfLines={1}>
              {entry.user?.firstName} {entry.user?.lastName}
              {isCurrentUser && ' (You)'}
            </Text>
            {entry.user?.verificationBadge && (
              <MaterialCommunityIcons name="check-decagram" size={16} color="#00A651" />
            )}
          </View>

          <View style={styles.statsRow}>
            <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
            <Text style={styles.points}>{entry.points.toLocaleString()} pts</Text>

            {entry.change !== 0 && (
              <>
                <MaterialCommunityIcons
                  name={getChangeIcon(entry.change) as any}
                  size={14}
                  color={getChangeColor(entry.change)}
                  style={styles.changeIcon}
                />
                <Text style={[styles.change, { color: getChangeColor(entry.change) }]}>
                  {Math.abs(entry.change)}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Chevron */}
      <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 8,
  },
  currentUserContainer: {
    backgroundColor: '#E8F5E8',
    borderWidth: 2,
    borderColor: '#00A651',
  },
  rankContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginRight: 4,
    flex: 1,
  },
  currentUserName: {
    color: '#00A651',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  points: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFC107',
    marginLeft: 4,
  },
  changeIcon: {
    marginLeft: 12,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
});
```

**Verification Checklist:**
- [ ] Component renders correctly
- [ ] Rank medals display for top 3
- [ ] Change indicators work
- [ ] Current user highlighting works
- [ ] Avatar displays correctly
- [ ] Verification badge shows

---

## Screen Implementations

### Task 3.8: Create Gamification Dashboard Screen
**File:** `Hommie_Mobile/src/screens/GamificationDashboardScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGamification } from '../contexts/GamificationContext';
import { AchievementCard } from '../components/AchievementCard';
import { LeaderboardCard } from '../components/LeaderboardCard';
import { ScreenHeader } from '../components/ScreenHeader';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface GamificationDashboardScreenProps {
  navigation: any;
}

export default function GamificationDashboardScreen({
  navigation,
}: GamificationDashboardScreenProps) {
  const {
    dashboard,
    userPoints,
    achievements,
    badges,
    leaderboard,
    userRank,
    isRefreshing,
    refreshDashboard,
  } = useGamification();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'leaderboard'>(
    'overview'
  );

  useEffect(() => {
    refreshDashboard();
  }, []);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refreshDashboard();
  };

  const handleTabPress = (tab: 'overview' | 'achievements' | 'leaderboard') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
  };

  const getLevelProgress = (): number => {
    if (!userPoints) return 0;

    const levels = [
      { level: 1, minPoints: 0 },
      { level: 2, minPoints: 100 },
      { level: 3, minPoints: 250 },
      { level: 4, minPoints: 500 },
      { level: 5, minPoints: 1000 },
      { level: 6, minPoints: 2000 },
    ];

    const currentLevel = levels.find((l) => l.level === userPoints.level);
    const nextLevel = levels.find((l) => l.level === userPoints.level + 1);

    if (!currentLevel || !nextLevel) return 100;

    const pointsInLevel = userPoints.totalPoints - currentLevel.minPoints;
    const pointsNeeded = nextLevel.minPoints - currentLevel.minPoints;

    return Math.min((pointsInLevel / pointsNeeded) * 100, 100);
  };

  // ==================== Overview Tab ====================
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Level Card */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <View style={styles.levelIconContainer}>
            <MaterialCommunityIcons name="crown" size={32} color="#FFD700" />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{userPoints?.levelName}</Text>
            <Text style={styles.levelSubtitle}>Level {userPoints?.level}</Text>
          </View>
          <View style={styles.pointsContainer}>
            <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
            <Text style={styles.totalPoints}>{userPoints?.totalPoints.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${getLevelProgress()}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(getLevelProgress())}% to next level</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="calendar-today" size={20} color="#0066CC" />
            <Text style={styles.statValue}>{userPoints?.dailyPoints}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="calendar-week" size={20} color="#00A651" />
            <Text style={styles.statValue}>{userPoints?.weeklyPoints}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="fire" size={20} color="#FF6B35" />
            <Text style={styles.statValue}>{userPoints?.streakDays}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.statValue}>#{userRank?.rank || '-'}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        </View>
      </View>

      {/* Recent Achievements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <TouchableOpacity onPress={() => handleTabPress('achievements')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        {achievements.slice(0, 3).map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onPress={() => navigation.navigate('AchievementDetail', { achievement })}
          />
        ))}
      </View>

      {/* Recent Badges */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Badges</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BadgeSystem')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.badgesRow}>
          {badges.slice(0, 4).map((badge) => (
            <TouchableOpacity
              key={badge.id}
              style={styles.badgeItem}
              onPress={() => navigation.navigate('BadgeDetail', { badge })}
            >
              <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                <MaterialCommunityIcons name={badge.icon as any} size={24} color={badge.color} />
              </View>
              <Text style={styles.badgeName} numberOfLines={1}>
                {badge.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Top Leaders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Leaders</Text>
          <TouchableOpacity onPress={() => handleTabPress('leaderboard')}>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>
        {leaderboard.slice(0, 5).map((entry) => (
          <LeaderboardCard
            key={entry.userId}
            entry={entry}
            isCurrentUser={entry.userId === userRank?.userId}
            onPress={() => navigation.navigate('UserProfile', { userId: entry.userId })}
          />
        ))}
      </View>
    </View>
  );

  // ==================== Achievements Tab ====================
  const renderAchievements = () => (
    <View style={styles.tabContent}>
      <View style={styles.achievementsHeader}>
        <Text style={styles.achievementsStats}>
          {dashboard?.achievements.stats.unlocked}/{dashboard?.achievements.stats.total} Unlocked
        </Text>
        <Text style={styles.achievementsPercentage}>
          {dashboard?.achievements.stats.completionPercentage}% Complete
        </Text>
      </View>

      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          size="large"
          onPress={() => navigation.navigate('AchievementDetail', { achievement })}
        />
      ))}
    </View>
  );

  // ==================== Leaderboard Tab ====================
  const renderLeaderboard = () => (
    <View style={styles.tabContent}>
      {userRank && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankTitle}>Your Rank</Text>
          <LeaderboardCard entry={userRank} isCurrentUser={true} />
        </View>
      )}

      <Text style={styles.leaderboardTitle}>Top Contributors</Text>
      {leaderboard.map((entry) => (
        <LeaderboardCard
          key={entry.userId}
          entry={entry}
          isCurrentUser={entry.userId === userRank?.userId}
          onPress={() => navigation.navigate('UserProfile', { userId: entry.userId })}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Gamification" navigation={navigation} />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
          onPress={() => handleTabPress('overview')}
        >
          <MaterialCommunityIcons
            name="view-dashboard"
            size={20}
            color={selectedTab === 'overview' ? '#00A651' : '#8E8E8E'}
          />
          <Text style={[styles.tabText, selectedTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'achievements' && styles.activeTab]}
          onPress={() => handleTabPress('achievements')}
        >
          <MaterialCommunityIcons
            name="trophy"
            size={20}
            color={selectedTab === 'achievements' ? '#00A651' : '#8E8E8E'}
          />
          <Text style={[styles.tabText, selectedTab === 'achievements' && styles.activeTabText]}>
            Achievements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'leaderboard' && styles.activeTab]}
          onPress={() => handleTabPress('leaderboard')}
        >
          <MaterialCommunityIcons
            name="podium"
            size={20}
            color={selectedTab === 'leaderboard' ? '#00A651' : '#8E8E8E'}
          />
          <Text style={[styles.tabText, selectedTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#00A651"
          />
        }
      >
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'achievements' && renderAchievements()}
        {selectedTab === 'leaderboard' && renderLeaderboard()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#E8F5E8',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E8E',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#00A651',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  levelSubtitle: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  totalPoints: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFC107',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00A651',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E8E',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
  },
  seeAllButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A651',
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: (width - 80) / 4,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  achievementsHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  achievementsStats: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  achievementsPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00A651',
  },
  userRankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  userRankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 12,
  },
});
```

**Verification Checklist:**
- [ ] Screen renders correctly
- [ ] All tabs working
- [ ] Pull-to-refresh functional
- [ ] Navigation working
- [ ] Haptic feedback working
- [ ] Real-time data updates

---

## Real-time Updates

### Task 3.9: Implement WebSocket Connection
**File:** `Hommie_Mobile/src/services/GamificationRealtime.ts`

```typescript
import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import GamificationService, { Achievement, Badge } from './GamificationService';
import { EventEmitter } from 'events';

// ==================== Event Types ====================
export interface AchievementUnlockedEvent {
  userId: string;
  achievementId: string;
  achievement: Achievement;
  points: number;
}

export interface BadgeEarnedEvent {
  userId: string;
  badgeId: string;
  badge: Badge;
}

export interface PointsEarnedEvent {
  userId: string;
  activityType: string;
  pointsEarned: number;
  totalPoints: number;
}

export interface LevelUpEvent {
  userId: string;
  newLevel: number;
  levelName: string;
}

// ==================== Realtime Service ====================
class GamificationRealtimeService extends EventEmitter {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  // ==================== Connection ====================
  async connect(userId: string): Promise<void> {
    if (this.isConnected) {
      console.log('[Gamification RT] Already connected');
      return;
    }

    try {
      const token = await GamificationService.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      this.socket = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.setupEventListeners(userId);

      console.log('[Gamification RT] Connecting...');
    } catch (error) {
      console.error('[Gamification RT] Connection error:', error);
      this.emit('error', error);
    }
  }

  // ==================== Event Listeners ====================
  private setupEventListeners(userId: string): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[Gamification RT] Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Join user's personal gamification room
      this.socket?.emit('join:gamification', { userId });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Gamification RT] Disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Gamification RT] Connect error:', error);
      this.reconnectAttempts++;
      this.emit('error', error);
    });

    // Gamification events
    this.socket.on('achievement:unlocked', (data: AchievementUnlockedEvent) => {
      console.log('[Gamification RT] Achievement unlocked:', data);
      this.emit('achievement:unlocked', data);
    });

    this.socket.on('badge:earned', (data: BadgeEarnedEvent) => {
      console.log('[Gamification RT] Badge earned:', data);
      this.emit('badge:earned', data);
    });

    this.socket.on('points:earned', (data: PointsEarnedEvent) => {
      console.log('[Gamification RT] Points earned:', data);
      this.emit('points:earned', data);
    });

    this.socket.on('level:up', (data: LevelUpEvent) => {
      console.log('[Gamification RT] Level up:', data);
      this.emit('level:up', data);
    });

    this.socket.on('leaderboard:update', (data: any) => {
      console.log('[Gamification RT] Leaderboard updated:', data);
      this.emit('leaderboard:update', data);
    });
  }

  // ==================== Subscription Methods ====================
  onAchievementUnlocked(callback: (data: AchievementUnlockedEvent) => void): void {
    this.on('achievement:unlocked', callback);
  }

  onBadgeEarned(callback: (data: BadgeEarnedEvent) => void): void {
    this.on('badge:earned', callback);
  }

  onPointsEarned(callback: (data: PointsEarnedEvent) => void): void {
    this.on('points:earned', callback);
  }

  onLevelUp(callback: (data: LevelUpEvent) => void): void {
    this.on('level:up', callback);
  }

  onLeaderboardUpdate(callback: (data: any) => void): void {
    this.on('leaderboard:update', callback);
  }

  // ==================== Cleanup ====================
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.removeAllListeners();
      console.log('[Gamification RT] Disconnected and cleaned up');
    }
  }

  // ==================== Status ====================
  getConnectionStatus(): { connected: boolean; attempts: number } {
    return {
      connected: this.isConnected,
      attempts: this.reconnectAttempts,
    };
  }
}

export default new GamificationRealtimeService();
```

**Verification Checklist:**
- [ ] WebSocket connection established
- [ ] Event listeners working
- [ ] Reconnection logic functional
- [ ] Error handling implemented
- [ ] Cleanup working

---

### Task 3.10: Integrate Realtime with Context
**File:** `Hommie_Mobile/src/contexts/GamificationContext.tsx` (Update)

**Add to GamificationProvider:**
```typescript
import GamificationRealtime from '../services/GamificationRealtime';

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);

  // ... existing state

  // Setup realtime connection
  useEffect(() => {
    if (!userId) return;

    // Connect to realtime service
    GamificationRealtime.connect(userId);

    // Subscribe to events
    GamificationRealtime.onAchievementUnlocked((data) => {
      // Update achievements state
      refreshAchievements();
      // Show notification
      showAchievementUnlocked(data.achievement);
      // Refresh dashboard to update points
      refreshDashboard();
    });

    GamificationRealtime.onBadgeEarned((data) => {
      // Update badges state
      refreshBadges();
      // Show notification
      showBadgeEarned(data.badge);
    });

    GamificationRealtime.onPointsEarned((data) => {
      // Update points state optimistically
      setUserPoints((prev) =>
        prev ? { ...prev, totalPoints: data.totalPoints } : null
      );
    });

    GamificationRealtime.onLevelUp((data) => {
      // Show level up notification
      showLevelUp(data.newLevel, data.levelName);
      // Refresh dashboard
      refreshDashboard();
    });

    GamificationRealtime.onLeaderboardUpdate(() => {
      // Refresh leaderboard
      refreshLeaderboard();
    });

    // Cleanup on unmount
    return () => {
      GamificationRealtime.disconnect();
    };
  }, [userId]);

  // ... rest of provider
};
```

**Verification Checklist:**
- [ ] Realtime events trigger state updates
- [ ] Notifications show on events
- [ ] Dashboard refreshes on updates
- [ ] Cleanup working on unmount

---

## Notifications

### Task 3.11: Setup Push Notifications
**File:** `Hommie_Mobile/src/services/GamificationNotifications.ts`

```typescript
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Achievement, Badge } from './GamificationService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class GamificationNotificationsService {
  // ==================== Permission ====================
  async requestPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  // ==================== Achievement Notifications ====================
  async sendAchievementUnlockedNotification(achievement: Achievement): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏆 Achievement Unlocked!',
        body: `${achievement.name}: ${achievement.description}`,
        data: { type: 'achievement', achievementId: achievement.id },
        sound: true,
        badge: 1,
      },
      trigger: null, // Show immediately
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // ==================== Badge Notifications ====================
  async sendBadgeEarnedNotification(badge: Badge): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎖️ Badge Earned!',
        body: `You've earned the "${badge.name}" badge!`,
        data: { type: 'badge', badgeId: badge.id },
        sound: true,
        badge: 1,
      },
      trigger: null,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // ==================== Level Up Notifications ====================
  async sendLevelUpNotification(level: number, levelName: string): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⭐ Level Up!',
        body: `Congratulations! You've reached Level ${level}: ${levelName}`,
        data: { type: 'levelup', level },
        sound: true,
        badge: 1,
      },
      trigger: null,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // ==================== Daily Recap ====================
  async scheduleDailyRecap(): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    // Schedule for 8 PM daily
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Recap',
        body: 'Check out your community contributions today!',
        data: { type: 'daily_recap' },
        sound: false,
        badge: 0,
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
  }

  // ==================== Clear Badges ====================
  async clearBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }
}

export default new GamificationNotificationsService();
```

**Verification Checklist:**
- [ ] Notification permissions requested
- [ ] Achievement notifications working
- [ ] Badge notifications working
- [ ] Level up notifications working
- [ ] Daily recap scheduled
- [ ] Badge count clearing

---

## Testing Strategy

### Task 3.12: Unit Tests for Services
**File:** `Hommie_Mobile/src/services/__tests__/GamificationService.test.ts`

```typescript
import GamificationService from '../GamificationService';

describe('GamificationService', () => {
  beforeEach(() => {
    // Reset service state
    jest.clearAllMocks();
  });

  describe('Dashboard', () => {
    it('should fetch gamification dashboard', async () => {
      const response = await GamificationService.getDashboard();
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('points');
      expect(response.data).toHaveProperty('achievements');
      expect(response.data).toHaveProperty('badges');
    });
  });

  describe('Achievements', () => {
    it('should fetch all achievements', async () => {
      const response = await GamificationService.getAllAchievements();
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should fetch user achievements', async () => {
      const response = await GamificationService.getUserAchievements();
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should filter achievements by category', async () => {
      const response = await GamificationService.getUserAchievements('community');
      expect(response.success).toBe(true);
      response.data?.forEach(achievement => {
        expect(achievement.category).toBe('community');
      });
    });
  });

  describe('Badges', () => {
    it('should fetch all badges', async () => {
      const response = await GamificationService.getAllBadges();
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should claim a badge', async () => {
      const badgeId = 'test-badge-id';
      const response = await GamificationService.claimBadge(badgeId);
      expect(response.success).toBe(true);
      expect(response.data?.isClaimed).toBe(true);
    });

    it('should toggle badge visibility', async () => {
      const badgeId = 'test-badge-id';
      const response = await GamificationService.toggleBadgeVisibility(badgeId);
      expect(response.success).toBe(true);
    });
  });

  describe('Points', () => {
    it('should fetch user points', async () => {
      const response = await GamificationService.getUserPoints();
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('totalPoints');
      expect(response.data).toHaveProperty('level');
    });

    it('should fetch activity history', async () => {
      const response = await GamificationService.getActivityHistory();
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('Leaderboard', () => {
    it('should fetch leaderboard', async () => {
      const response = await GamificationService.getLeaderboard();
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('rankings');
      expect(response.data).toHaveProperty('totalParticipants');
    });

    it('should filter leaderboard by category and period', async () => {
      const response = await GamificationService.getLeaderboard('safety', 'weekly');
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data?.rankings)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network failure
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const response = await GamificationService.getDashboard();
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle 401 unauthorized', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Unauthorized' }),
        })
      );

      const response = await GamificationService.getDashboard();
      expect(response.success).toBe(false);
      expect(response.error).toContain('401');
    });
  });
});
```

---

### Task 3.13: Integration Tests
**File:** `Hommie_Mobile/src/__tests__/integration/Gamification.test.tsx`

```typescript
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { GamificationProvider } from '../../contexts/GamificationContext';
import GamificationDashboardScreen from '../../screens/GamificationDashboardScreen';

describe('Gamification Integration', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  it('should render dashboard with data', async () => {
    const { getByText, getByTestId } = render(
      <GamificationProvider>
        <GamificationDashboardScreen navigation={mockNavigation} />
      </GamificationProvider>
    );

    await waitFor(() => {
      expect(getByText(/Level/i)).toBeTruthy();
    });
  });

  it('should refresh dashboard on pull-to-refresh', async () => {
    const { getByTestId } = render(
      <GamificationProvider>
        <GamificationDashboardScreen navigation={mockNavigation} />
      </GamificationProvider>
    );

    const scrollView = getByTestId('gamification-scroll-view');
    fireEvent(scrollView, 'refresh');

    await waitFor(() => {
      // Verify data is refreshed
    });
  });

  it('should navigate to achievement detail', async () => {
    const { getByText } = render(
      <GamificationProvider>
        <GamificationDashboardScreen navigation={mockNavigation} />
      </GamificationProvider>
    );

    await waitFor(() => {
      const achievementCard = getByText(/New Neighbor/i);
      fireEvent.press(achievementCard);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('AchievementDetail', expect.any(Object));
    });
  });
});
```

---

## Implementation Timeline

### **Week 1: API Service Layer & State Management**

#### Day 1-2: API Services
- Task 3.1: Create Base Gamification Service ✅
- Task 3.2: Add Service to Main Exports ✅
- Test all API endpoints
- Handle authentication

#### Day 3-4: State Management
- Task 3.3: Create Gamification Context ✅
- Task 3.4: Add Provider to App Root ✅
- Test context throughout app
- Verify state updates

#### Day 5: Testing
- Write unit tests for services
- Test error handling
- Test token refresh
- Code review

---

### **Week 2: UI Components & Screen Updates**

#### Day 6-7: Reusable Components
- Task 3.5: Update Badge System Component ✅
- Task 3.6: Create Achievement Card Component ✅
- Task 3.7: Create Leaderboard Card Component ✅
- Test all components

#### Day 8-9: Screen Implementation
- Task 3.8: Create Gamification Dashboard Screen ✅
- Update BadgeSystemScreen to use real data
- Add loading & error states
- Test navigation flow

#### Day 10: Polish & Testing
- Add loading skeletons
- Implement pull-to-refresh
- Test offline behavior
- UI/UX review

---

### **Week 3: Real-time & Notifications**

#### Day 11-12: Real-time Updates
- Task 3.9: Implement WebSocket Connection ✅
- Task 3.10: Integrate Realtime with Context ✅
- Test event handling
- Test reconnection logic

#### Day 13-14: Push Notifications
- Task 3.11: Setup Push Notifications ✅
- Configure iOS & Android
- Test notification delivery
- Test notification actions

#### Day 15: Integration Testing
- Task 3.12: Unit Tests for Services ✅
- Task 3.13: Integration Tests ✅
- End-to-end testing
- Performance testing

---

### **Week 4: Polish & Launch**

#### Day 16-17: Apple HIG Compliance
- Implement SF Symbols
- Add haptic feedback everywhere
- VoiceOver support
- Dynamic Type support
- Dark mode support

#### Day 18: Performance Optimization
- Optimize API calls
- Implement caching
- Reduce bundle size
- Test on low-end devices

#### Day 19: Documentation & Training
- Update README
- Create user guides
- Team training
- QA handoff

#### Day 20: Launch Preparation
- Final testing
- Beta deployment
- Monitor metrics
- Gather feedback

---

## Summary

### Total Implementation Effort
- **4 Weeks** (20 working days)
- **13 Major Tasks** broken into ~60 subtasks
- **15+ New Files** created
- **10+ Existing Files** updated

### Key Deliverables
1. ✅ Complete API service layer with TypeScript types
2. ✅ Global state management with Context API
3. ✅ Real-time WebSocket integration
4. ✅ Push notifications for all gamification events
5. ✅ iOS-compliant UI components
6. ✅ Comprehensive testing suite
7. ✅ Performance optimizations
8. ✅ Documentation & guides

### Success Metrics
- [ ] 100% backend API coverage
- [ ] <2s dashboard load time
- [ ] 100% real-time event delivery
- [ ] 95%+ notification delivery rate
- [ ] AA accessibility score
- [ ] 60 FPS UI performance
- [ ] <5% crash rate

---

**Ready for Implementation! 🚀**
