import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { 
  ACHIEVEMENTS, 
  BADGES, 
  CONTRIBUTION_ACTIVITIES, 
  CONTRIBUTION_LEVELS, 
  LEADERBOARD_CATEGORIES,
  Achievement,
  Badge,
  ContributionLevel
} from '../constants/gamificationData';

const { width } = Dimensions.get('window');

interface UserEngagementData {
  totalPoints: number;
  currentLevel: number;
  achievements: string[];
  badges: string[];
  weeklyActivity: {
    posts: number;
    comments: number;
    events: number;
    safetyReports: number;
    helpfulVotes: number;
  };
  monthlyStats: {
    contributionRank: number;
    totalContributors: number;
    streakDays: number;
    impactScore: number;
  };
  recentActivities: {
    id: string;
    type: string;
    description: string;
    points: number;
    timestamp: string;
  }[];
}

export default function CommunityEngagementScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('overall');
  
  // Mock user engagement data
  const [userEngagement] = useState<UserEngagementData>({
    totalPoints: 1250,
    currentLevel: 4,
    achievements: ['new_neighbor', 'first_post', 'helpful_neighbor', 'safety_first', 'event_goer'],
    badges: ['verified_neighbor', 'helpful_neighbor', 'safety_champion'],
    weeklyActivity: {
      posts: 3,
      comments: 12,
      events: 2,
      safetyReports: 1,
      helpfulVotes: 8
    },
    monthlyStats: {
      contributionRank: 15,
      totalContributors: 247,
      streakDays: 12,
      impactScore: 89
    },
    recentActivities: [
      {
        id: '1',
        type: 'helpful_comment',
        description: 'Helped neighbor with generator advice',
        points: 6,
        timestamp: '2 hours ago'
      },
      {
        id: '2',
        type: 'attend_event',
        description: 'Attended Estate Security Meeting',
        points: 8,
        timestamp: '1 day ago'
      },
      {
        id: '3',
        type: 'safety_report',
        description: 'Reported street light outage',
        points: 36,
        timestamp: '2 days ago'
      },
      {
        id: '4',
        type: 'create_post',
        description: 'Posted about lost pet',
        points: 10,
        timestamp: '3 days ago'
      }
    ]
  });

  const getCurrentLevel = (): ContributionLevel => {
    return CONTRIBUTION_LEVELS.find(level => 
      userEngagement.totalPoints >= level.minPoints && 
      userEngagement.totalPoints <= level.maxPoints
    ) || CONTRIBUTION_LEVELS[0];
  };

  const getNextLevel = (): ContributionLevel | null => {
    const currentLevel = getCurrentLevel();
    return CONTRIBUTION_LEVELS.find(level => level.level === currentLevel.level + 1) || null;
  };

  const getProgressToNextLevel = (): number => {
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    if (!nextLevel) return 100;
    
    const progress = ((userEngagement.totalPoints - currentLevel.minPoints) / 
                     (nextLevel.minPoints - currentLevel.minPoints)) * 100;
    return Math.min(progress, 100);
  };

  const getUserAchievements = (): Achievement[] => {
    return ACHIEVEMENTS.filter(achievement => 
      userEngagement.achievements.includes(achievement.id)
    );
  };

  const getUserBadges = (): Badge[] => {
    return BADGES.filter(badge => 
      userEngagement.badges.includes(badge.id)
    );
  };

  const getActivityIcon = (type: string): string => {
    const activity = CONTRIBUTION_ACTIVITIES.find(act => act.id === type);
    return activity?.icon || 'circle';
  };

  const getActivityColor = (type: string): string => {
    const activity = CONTRIBUTION_ACTIVITIES.find(act => act.id === type);
    return activity?.color || '#8E8E8E';
  };

  const handleClaimReward = () => {
    Alert.alert(
      'Daily Reward',
      'Claim your daily activity bonus!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim 25 Points',
          onPress: () => Alert.alert('Reward Claimed!', 'You earned 25 bonus points for your daily streak!')
        }
      ]
    );
  };

  const handleViewAllAchievements = () => {
    Alert.alert('All Achievements', 'Navigate to full achievements gallery');
  };

  const handleJoinChallenge = (challengeName: string) => {
    Alert.alert(
      'Join Challenge',
      `Join the "${challengeName}" challenge?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: () => Alert.alert('Challenge Joined!', `You're now participating in ${challengeName}`)
        }
      ]
    );
  };

  const renderOverviewTab = () => {
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    const progress = getProgressToNextLevel();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Level Progress Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View style={styles.levelIcon}>
              <MaterialCommunityIcons name={currentLevel.icon as any} size={32} color={currentLevel.color} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelName}>{currentLevel.name}</Text>
              <Text style={styles.levelPoints}>{userEngagement.totalPoints} points</Text>
            </View>
            <TouchableOpacity style={styles.rewardButton} onPress={handleClaimReward}>
              <MaterialCommunityIcons name="gift" size={20} color="#FFC107" />
              <Text style={styles.rewardText}>Claim</Text>
            </TouchableOpacity>
          </View>
          
          {nextLevel && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: currentLevel.color }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressText}>
                  {nextLevel.minPoints - userEngagement.totalPoints} points to {nextLevel.name}
                </Text>
                <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              </View>
            </View>
          )}
        </View>

        {/* Weekly Activity Summary */}
        <View style={styles.activityCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>This Week's Activity</Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E8E" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityGrid}>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="message-plus" size={20} color="#0066CC" />
              <Text style={styles.activityNumber}>{userEngagement.weeklyActivity.posts}</Text>
              <Text style={styles.activityLabel}>Posts</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="comment-check" size={20} color="#00A651" />
              <Text style={styles.activityNumber}>{userEngagement.weeklyActivity.comments}</Text>
              <Text style={styles.activityLabel}>Comments</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#FF69B4" />
              <Text style={styles.activityNumber}>{userEngagement.weeklyActivity.events}</Text>
              <Text style={styles.activityLabel}>Events</Text>
            </View>
            <View style={styles.activityItem}>
              <MaterialCommunityIcons name="shield-alert" size={20} color="#E74C3C" />
              <Text style={styles.activityNumber}>{userEngagement.weeklyActivity.safetyReports}</Text>
              <Text style={styles.activityLabel}>Safety</Text>
            </View>
          </View>
        </View>

        {/* Community Impact Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Community Impact</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trending-up" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>#{userEngagement.monthlyStats.contributionRank}</Text>
              <Text style={styles.statLabel}>Community Rank</Text>
              <Text style={styles.statSubtext}>of {userEngagement.monthlyStats.totalContributors}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={24} color="#FF6B35" />
              <Text style={styles.statNumber}>{userEngagement.monthlyStats.streakDays}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
              <Text style={styles.statSubtext}>Keep it up!</Text>
            </View>
          </View>
          
          <View style={styles.impactMeter}>
            <Text style={styles.impactLabel}>Community Impact Score</Text>
            <View style={styles.impactBar}>
              <View style={[styles.impactFill, { width: `${userEngagement.monthlyStats.impactScore}%` }]} />
            </View>
            <Text style={styles.impactScore}>{userEngagement.monthlyStats.impactScore}/100</Text>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.recentCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Activities</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {userEngagement.recentActivities.slice(0, 4).map((activity) => (
            <View key={activity.id} style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
                <MaterialCommunityIcons 
                  name={getActivityIcon(activity.type) as any} 
                  size={16} 
                  color={getActivityColor(activity.type)} 
                />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.timestamp}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>+{activity.points}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Active Challenges */}
        <View style={styles.challengesCard}>
          <Text style={styles.cardTitle}>Active Challenges</Text>
          
          <View style={styles.challengeItem}>
            <MaterialCommunityIcons name="target" size={24} color="#FF6B35" />
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeName}>Weekly Helper</Text>
              <Text style={styles.challengeDesc}>Help 5 neighbors this week</Text>
              <View style={styles.challengeProgress}>
                <View style={styles.challengeBar}>
                  <View style={[styles.challengeFill, { width: '60%' }]} />
                </View>
                <Text style={styles.challengeText}>3/5</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.challengeItem}>
            <MaterialCommunityIcons name="calendar-star" size={24} color="#FF69B4" />
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeName}>Event Organizer</Text>
              <Text style={styles.challengeDesc}>Organize a community event</Text>
              <TouchableOpacity 
                style={styles.joinButton}
                onPress={() => handleJoinChallenge('Event Organizer')}
              >
                <Text style={styles.joinButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAchievementsTab = () => {
    const userAchievements = getUserAchievements();
    const userBadges = getUserBadges();

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Badges Section */}
        <View style={styles.badgesCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Your Badges</Text>
            <Text style={styles.badgeCount}>{userBadges.length}</Text>
          </View>
          
          <View style={styles.badgesGrid}>
            {userBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                  <MaterialCommunityIcons name={badge.icon as any} size={24} color={badge.color} />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Achievements</Text>
            <TouchableOpacity onPress={handleViewAllAchievements}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {userAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                <MaterialCommunityIcons name={achievement.icon as any} size={24} color={achievement.color} />
              </View>
              <View style={styles.achievementDetails}>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
              </View>
              <View style={styles.achievementPoints}>
                <Text style={styles.pointsEarned}>+{achievement.points}</Text>
                <Text style={styles.rarityText}>{achievement.rarity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Available Achievements */}
        <View style={styles.availableCard}>
          <Text style={styles.cardTitle}>Available Achievements</Text>
          
          {ACHIEVEMENTS.filter(achievement => 
            !userEngagement.achievements.includes(achievement.id)
          ).slice(0, 3).map((achievement) => (
            <View key={achievement.id} style={styles.lockedAchievement}>
              <View style={[styles.achievementIcon, styles.lockedIcon]}>
                <MaterialCommunityIcons name="lock" size={24} color="#8E8E8E" />
              </View>
              <View style={styles.achievementDetails}>
                <Text style={styles.lockedName}>{achievement.name}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
                <Text style={styles.requirementText}>{achievement.requirements.description}</Text>
              </View>
              <View style={styles.achievementPoints}>
                <Text style={styles.lockedPoints}>{achievement.points}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderLeaderboardTab = () => {
    // Mock leaderboard data
    const leaderboardData = [
      { rank: 1, name: 'Adebayo O.', points: 2150, avatar: '👨🏾', badge: 'community_legend' },
      { rank: 2, name: 'Sarah A.', points: 1980, avatar: '👩🏾', badge: 'estate_leader' },
      { rank: 3, name: 'Emeka K.', points: 1750, avatar: '👨🏾', badge: 'safety_champion' },
      { rank: 4, name: 'Fatima M.', points: 1650, avatar: '👩🏾', badge: 'helpful_neighbor' },
      { rank: 5, name: 'Chidi I.', points: 1520, avatar: '👨🏾', badge: 'business_verified' },
      { rank: 15, name: 'You', points: userEngagement.totalPoints, avatar: '👤', badge: 'helpful_neighbor' }
    ];

    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {/* Category Selector */}
        <View style={styles.categorySelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {LEADERBOARD_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialCommunityIcons 
                  name={category.icon as any} 
                  size={16} 
                  color={selectedCategory === category.id ? '#FFFFFF' : category.color} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Your Rank Card */}
        <View style={styles.yourRankCard}>
          <Text style={styles.cardTitle}>Your Position</Text>
          <View style={styles.rankInfo}>
            <View style={styles.rankNumber}>
              <Text style={styles.rankText}>#{userEngagement.monthlyStats.contributionRank}</Text>
            </View>
            <View style={styles.rankDetails}>
              <Text style={styles.rankLabel}>Community Rank</Text>
              <Text style={styles.rankSubtext}>
                Top {Math.round((userEngagement.monthlyStats.contributionRank / userEngagement.monthlyStats.totalContributors) * 100)}% 
                of contributors
              </Text>
            </View>
          </View>
        </View>

        {/* Leaderboard */}
        <View style={styles.leaderboardCard}>
          <Text style={styles.cardTitle}>Community Leaders</Text>
          
          {leaderboardData.map((user) => (
            <View 
              key={user.rank} 
              style={[
                styles.leaderboardItem,
                user.name === 'You' && styles.currentUserItem
              ]}
            >
              <View style={styles.leaderRank}>
                {user.rank <= 3 ? (
                  <MaterialCommunityIcons 
                    name={user.rank === 1 ? 'crown' : user.rank === 2 ? 'medal' : 'trophy-variant'} 
                    size={20} 
                    color={user.rank === 1 ? '#FFD700' : user.rank === 2 ? '#C0C0C0' : '#CD7F32'} 
                  />
                ) : (
                  <Text style={styles.rankNumber}>{user.rank}</Text>
                )}
              </View>
              
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>{user.avatar}</Text>
              </View>
              
              <View style={styles.userInfo}>
                <Text style={[styles.userName, user.name === 'You' && styles.currentUserName]}>
                  {user.name}
                </Text>
                <Text style={styles.userPoints}>{user.points} points</Text>
              </View>
              
              <View style={styles.userBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#00A651" />
              </View>
            </View>
          ))}
          
          <TouchableOpacity style={styles.viewFullButton}>
            <Text style={styles.viewFullText}>View Full Leaderboard</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#00A651" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Engagement</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#00A651" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <MaterialCommunityIcons 
            name="view-dashboard" 
            size={20} 
            color={activeTab === 'overview' ? '#00A651' : '#8E8E8E'} 
          />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <MaterialCommunityIcons 
            name="trophy" 
            size={20} 
            color={activeTab === 'achievements' ? '#00A651' : '#8E8E8E'} 
          />
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
            Achievements
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <MaterialCommunityIcons 
            name="podium" 
            size={20} 
            color={activeTab === 'leaderboard' ? '#00A651' : '#8E8E8E'} 
          />
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'achievements' && renderAchievementsTab()}
      {activeTab === 'leaderboard' && renderLeaderboardTab()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  tabNavigation: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#00A651',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00A651',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  levelPoints: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  rewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFC107',
    marginLeft: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    alignItems: 'center',
  },
  activityNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 4,
    marginBottom: 2,
  },
  activityLabel: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
    marginTop: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 10,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  impactMeter: {
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  impactBar: {
    width: width - 96,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginBottom: 4,
  },
  impactFill: {
    height: '100%',
    backgroundColor: '#00A651',
    borderRadius: 4,
  },
  impactScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A651',
  },
  recentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: '#00A651',
    fontWeight: '600',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#2C2C2C',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  pointsBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00A651',
  },
  challengesCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  challengeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  challengeDesc: {
    fontSize: 12,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  challengeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginRight: 8,
  },
  challengeFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  challengeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  joinButton: {
    backgroundColor: '#00A651',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgesCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badgeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A651',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: (width - 80) / 3,
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  achievementsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementDetails: {
    flex: 1,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  achievementPoints: {
    alignItems: 'center',
  },
  pointsEarned: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00A651',
    marginBottom: 2,
  },
  rarityText: {
    fontSize: 10,
    color: '#8E8E8E',
    textTransform: 'capitalize',
  },
  availableCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lockedAchievement: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    opacity: 0.6,
  },
  lockedIcon: {
    backgroundColor: '#F5F5F5',
  },
  lockedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E8E',
    marginBottom: 2,
  },
  requirementText: {
    fontSize: 11,
    color: '#0066CC',
    marginTop: 2,
  },
  lockedPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E8E',
  },
  categorySelector: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    marginLeft: 16,
  },
  categoryChipActive: {
    backgroundColor: '#00A651',
  },
  categoryText: {
    fontSize: 12,
    color: '#2C2C2C',
    marginLeft: 4,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  yourRankCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00A651',
  },
  rankDetails: {
    flex: 1,
  },
  rankLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  rankSubtext: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  currentUserItem: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  leaderRank: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E8E',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  currentUserName: {
    color: '#00A651',
  },
  userPoints: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  userBadge: {
    marginLeft: 8,
  },
  viewFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewFullText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00A651',
    marginRight: 4,
  },
});