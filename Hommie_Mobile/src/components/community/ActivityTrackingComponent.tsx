import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  CONTRIBUTION_ACTIVITIES, 
  CONTRIBUTION_LEVELS, 
  ACHIEVEMENTS,
  ContributionActivity,
  ContributionLevel 
} from '../../constants/gamificationData';

interface ActivityTrackingProps {
  userId?: string;
  onActivityComplete?: (activity: ContributionActivity, pointsEarned: number) => void;
  showFloatingWidget?: boolean;
  compactMode?: boolean;
}

interface UserActivity {
  totalPoints: number;
  todayPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  recentActivities: {
    type: string;
    points: number;
    timestamp: Date;
    description?: string;
  }[];
}

export default function ActivityTrackingComponent({ 
  userId = 'default',
  onActivityComplete,
  showFloatingWidget = false,
  compactMode = false 
}: ActivityTrackingProps) {
  const [userActivity, setUserActivity] = useState<UserActivity>({
    totalPoints: 1250,
    todayPoints: 45,
    weeklyPoints: 180,
    monthlyPoints: 720,
    currentStreak: 12,
    longestStreak: 28,
    lastActivityDate: new Date().toISOString().split('T')[0],
    recentActivities: []
  });

  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);

  // Track user activity and update points
  const trackActivity = (activityType: string, customPoints?: number, description?: string) => {
    const activity = CONTRIBUTION_ACTIVITIES.find(act => act.id === activityType);
    if (!activity) return;

    const pointsEarned = customPoints || calculatePoints(activity);
    const newActivity = {
      type: activityType,
      points: pointsEarned,
      timestamp: new Date(),
      description: description || activity.description
    };

    // Update user activity
    setUserActivity(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + pointsEarned,
      todayPoints: prev.todayPoints + pointsEarned,
      weeklyPoints: prev.weeklyPoints + pointsEarned,
      monthlyPoints: prev.monthlyPoints + pointsEarned,
      currentStreak: updateStreak(prev),
      lastActivityDate: new Date().toISOString().split('T')[0],
      recentActivities: [newActivity, ...prev.recentActivities.slice(0, 9)]
    }));

    // Show points animation
    setLastPointsEarned(pointsEarned);
    setShowPointsAnimation(true);
    setTimeout(() => setShowPointsAnimation(false), 2000);

    // Check for achievements
    checkAchievements(userActivity.totalPoints + pointsEarned);

    // Callback for parent component
    onActivityComplete?.(activity, pointsEarned);
  };

  const calculatePoints = (activity: ContributionActivity): number => {
    // Calculate points based on base points and multipliers
    let points = activity.basePoints;
    
    // Time-based multipliers
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 9) {
      points *= 1.2; // Morning boost
    } else if (hour >= 18 && hour <= 21) {
      points *= 1.1; // Evening boost
    }

    // Streak multiplier
    if (userActivity.currentStreak >= 7) {
      points *= 1.3; // Weekly streak bonus
    } else if (userActivity.currentStreak >= 3) {
      points *= 1.1; // Mini streak bonus
    }

    // Apply activity-specific multiplier
    points *= activity.multiplier;

    return Math.round(points);
  };

  const updateStreak = (prevActivity: UserActivity): number => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (prevActivity.lastActivityDate === yesterday) {
      return prevActivity.currentStreak + 1;
    } else if (prevActivity.lastActivityDate === today) {
      return prevActivity.currentStreak;
    } else {
      return 1; // Reset streak
    }
  };

  const checkAchievements = (newTotalPoints: number) => {
    // Check for level-based achievements
    const oldLevel = getCurrentLevel(userActivity.totalPoints);
    const newLevel = getCurrentLevel(newTotalPoints);
    
    if (newLevel.level > oldLevel.level) {
      Alert.alert(
        'Level Up! 🎉',
        `Congratulations! You've reached ${newLevel.name}`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    }

    // Check specific achievements
    // This would be more comprehensive in a real implementation
    if (newTotalPoints >= 1000 && userActivity.totalPoints < 1000) {
      Alert.alert('Achievement Unlocked!', 'Community Builder - You\'ve earned 1000+ points!');
    }
  };

  const getCurrentLevel = (points: number): ContributionLevel => {
    return CONTRIBUTION_LEVELS.find(level => 
      points >= level.minPoints && points <= level.maxPoints
    ) || CONTRIBUTION_LEVELS[0];
  };

  const getProgressToNextLevel = (): number => {
    const currentLevel = getCurrentLevel(userActivity.totalPoints);
    const nextLevel = CONTRIBUTION_LEVELS.find(level => level.level === currentLevel.level + 1);
    
    if (!nextLevel) return 100;
    
    const progress = ((userActivity.totalPoints - currentLevel.minPoints) / 
                     (nextLevel.minPoints - currentLevel.minPoints)) * 100;
    return Math.min(progress, 100);
  };

  // Compact mode for smaller displays
  if (compactMode) {
    const currentLevel = getCurrentLevel(userActivity.totalPoints);
    
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <View style={[styles.levelIndicator, { backgroundColor: currentLevel.color }]}>
            <MaterialCommunityIcons name={currentLevel.icon as any} size={16} color="#FFFFFF" />
          </View>
          <View style={styles.compactInfo}>
            <Text style={styles.compactLevel}>{currentLevel.name}</Text>
            <Text style={styles.compactPoints}>{userActivity.totalPoints} pts</Text>
          </View>
          <TouchableOpacity style={styles.streakBadge}>
            <MaterialCommunityIcons name="fire" size={12} color="#FF6B35" />
            <Text style={styles.streakText}>{userActivity.currentStreak}</Text>
          </TouchableOpacity>
        </View>
        
        {showPointsAnimation && (
          <View style={styles.pointsAnimation}>
            <Text style={styles.pointsAnimationText}>+{lastPointsEarned}</Text>
          </View>
        )}
      </View>
    );
  }

  // Floating widget mode
  if (showFloatingWidget) {
    return (
      <View style={styles.floatingWidget}>
        <TouchableOpacity style={styles.floatingButton}>
          <MaterialCommunityIcons name="star-circle" size={24} color="#FFD700" />
          <Text style={styles.floatingPoints}>{userActivity.todayPoints}</Text>
        </TouchableOpacity>
        
        {showPointsAnimation && (
          <View style={styles.floatingAnimation}>
            <Text style={styles.floatingAnimationText}>+{lastPointsEarned}</Text>
          </View>
        )}
      </View>
    );
  }

  // Full widget mode
  const currentLevel = getCurrentLevel(userActivity.totalPoints);
  const nextLevel = CONTRIBUTION_LEVELS.find(level => level.level === currentLevel.level + 1);
  const progress = getProgressToNextLevel();

  return (
    <View style={styles.container}>
      {/* Level Progress */}
      <View style={styles.levelSection}>
        <View style={styles.levelHeader}>
          <View style={[styles.levelIcon, { backgroundColor: currentLevel.color + '20' }]}>
            <MaterialCommunityIcons name={currentLevel.icon as any} size={24} color={currentLevel.color} />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelName}>{currentLevel.name}</Text>
            <Text style={styles.levelPoints}>{userActivity.totalPoints} points</Text>
          </View>
          <View style={styles.streakContainer}>
            <MaterialCommunityIcons name="fire" size={16} color="#FF6B35" />
            <Text style={styles.streakCount}>{userActivity.currentStreak}</Text>
          </View>
        </View>
        
        {nextLevel && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${progress}%`, backgroundColor: currentLevel.color }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {nextLevel.minPoints - userActivity.totalPoints} points to {nextLevel.name}
            </Text>
          </View>
        )}
      </View>

      {/* Daily Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="calendar-today" size={16} color="#0066CC" />
          <Text style={styles.statNumber}>{userActivity.todayPoints}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="calendar-week" size={16} color="#00A651" />
          <Text style={styles.statNumber}>{userActivity.weeklyPoints}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="calendar-month" size={16} color="#FF6B35" />
          <Text style={styles.statNumber}>{userActivity.monthlyPoints}</Text>
          <Text style={styles.statLabel}>This Month</Text>
        </View>
      </View>

      {/* Points Animation */}
      {showPointsAnimation && (
        <View style={styles.pointsAnimation}>
          <Text style={styles.pointsAnimationText}>+{lastPointsEarned} points!</Text>
        </View>
      )}

      {/* Quick Actions for Testing */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => trackActivity('create_post', undefined, 'Posted community update')}
        >
          <MaterialCommunityIcons name="message-plus" size={16} color="#0066CC" />
          <Text style={styles.actionText}>Post</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => trackActivity('helpful_comment', undefined, 'Helped neighbor with advice')}
        >
          <MaterialCommunityIcons name="comment-check" size={16} color="#00A651" />
          <Text style={styles.actionText}>Help</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => trackActivity('safety_report', undefined, 'Reported safety concern')}
        >
          <MaterialCommunityIcons name="shield-alert" size={16} color="#E74C3C" />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  compactInfo: {
    flex: 1,
  },
  compactLevel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  compactPoints: {
    fontSize: 10,
    color: '#8E8E8E',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 2,
  },
  floatingWidget: {
    position: 'absolute',
    top: 100,
    right: 16,
    zIndex: 1000,
  },
  floatingButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  floatingPoints: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    marginLeft: 4,
  },
  floatingAnimation: {
    position: 'absolute',
    top: -30,
    right: 10,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  floatingAnimationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  levelSection: {
    marginBottom: 16,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  levelPoints: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E8E',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 8,
  },
  pointsAnimation: {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: '#00A651',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    zIndex: 100,
  },
  pointsAnimationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E8E',
    marginLeft: 4,
  },
});