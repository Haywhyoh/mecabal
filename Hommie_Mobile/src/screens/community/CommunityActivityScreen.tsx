import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { contextAwareGoBack } from '../utils/navigationUtils';

const { width } = Dimensions.get('window');

interface ActivityScore {
  category: string;
  points: number;
  maxPoints: number;
  level: number;
  nextLevelPoints: number;
  activities: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'event' | 'safety' | 'help' | 'review' | 'report';
  title: string;
  description: string;
  points: number;
  timestamp: string;
  location: string;
  impact: 'low' | 'medium' | 'high';
  verified: boolean;
}

interface CommunityRank {
  rank: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirements: number;
  benefits: string[];
}

const COMMUNITY_RANKS: CommunityRank[] = [
  {
    rank: 1,
    title: 'New Neighbor',
    description: 'Welcome to the community!',
    icon: 'home',
    color: '#8E8E8E',
    requirements: 0,
    benefits: ['Profile creation', 'Basic posting']
  },
  {
    rank: 2,
    title: 'Active Neighbor',
    description: 'Getting involved in community activities',
    icon: 'account',
    color: '#FFC107',
    requirements: 100,
    benefits: ['Event creation', 'Business recommendations', 'Priority support']
  },
  {
    rank: 3,
    title: 'Helpful Neighbor',
    description: 'Known for helping fellow neighbors',
    icon: 'hand-heart',
    color: '#FF6B35',
    requirements: 500,
    benefits: ['Skill verification privileges', 'Community moderation', 'Special recognition']
  },
  {
    rank: 4,
    title: 'Community Champion',
    description: 'A pillar of the community',
    icon: 'star-circle',
    color: '#00A651',
    requirements: 1500,
    benefits: ['Event hosting privileges', 'Business verification', 'Leadership badges']
  },
  {
    rank: 5,
    title: 'Estate Leader',
    description: 'Trusted community leader',
    icon: 'crown',
    color: '#0066CC',
    requirements: 3000,
    benefits: ['Community administration', 'Safety coordination', 'Premium features']
  }
];

export default function CommunityActivityScreen() {
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showRankModal, setShowRankModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  // Mock user activity data
  const [userStats] = useState({
    totalPoints: 1247,
    currentRank: 3,
    weeklyPoints: 156,
    monthlyPoints: 423,
    yearlyPoints: 1247,
    streak: 12, // days
    helpfulVotes: 89,
    safetyContributions: 15,
    eventsAttended: 8,
    postsShared: 24
  });

  const [activityScores] = useState<ActivityScore[]>([
    {
      category: 'Community Posts',
      points: 340,
      maxPoints: 500,
      level: 3,
      nextLevelPoints: 160,
      activities: [
        {
          id: '1',
          type: 'post',
          title: 'Shared neighborhood watch update',
          description: 'Posted important safety information for Victoria Island Estate',
          points: 25,
          timestamp: '2024-08-17T14:30:00Z',
          location: 'Victoria Island Estate',
          impact: 'high',
          verified: true
        },
        {
          id: '2',
          type: 'comment',
          title: 'Helped with plumbing question',
          description: 'Provided helpful advice on water pressure issues',
          points: 15,
          timestamp: '2024-08-16T09:15:00Z',
          location: 'Victoria Island Estate',
          impact: 'medium',
          verified: true
        }
      ]
    },
    {
      category: 'Event Participation',
      points: 180,
      maxPoints: 300,
      level: 2,
      nextLevelPoints: 120,
      activities: [
        {
          id: '3',
          type: 'event',
          title: 'Attended community cleanup',
          description: 'Participated in estate beautification project',
          points: 50,
          timestamp: '2024-08-15T08:00:00Z',
          location: 'Victoria Island Estate',
          impact: 'high',
          verified: true
        },
        {
          id: '4',
          type: 'event',
          title: 'Joined security meeting',
          description: 'Attended monthly security briefing',
          points: 30,
          timestamp: '2024-08-10T18:00:00Z',
          location: 'Victoria Island Estate',
          impact: 'medium',
          verified: true
        }
      ]
    },
    {
      category: 'Safety & Security',
      points: 225,
      maxPoints: 400,
      level: 2,
      nextLevelPoints: 175,
      activities: [
        {
          id: '5',
          type: 'safety',
          title: 'Reported suspicious activity',
          description: 'Alerted security about unusual behavior near Block C',
          points: 40,
          timestamp: '2024-08-14T22:30:00Z',
          location: 'Victoria Island Estate',
          impact: 'high',
          verified: true
        },
        {
          id: '6',
          type: 'safety',
          title: 'Shared safety tip',
          description: 'Posted advice about home security during travel',
          points: 20,
          timestamp: '2024-08-12T16:45:00Z',
          location: 'Victoria Island Estate',
          impact: 'medium',
          verified: true
        }
      ]
    },
    {
      category: 'Helpful Actions',
      points: 502,
      maxPoints: 600,
      level: 4,
      nextLevelPoints: 98,
      activities: [
        {
          id: '7',
          type: 'help',
          title: 'Provided service recommendation',
          description: 'Recommended reliable electrician to neighbor',
          points: 25,
          timestamp: '2024-08-13T11:20:00Z',
          location: 'Victoria Island Estate',
          impact: 'medium',
          verified: true
        },
        {
          id: '8',
          type: 'review',
          title: 'Reviewed local business',
          description: 'Left detailed review for cleaning service',
          points: 15,
          timestamp: '2024-08-11T15:10:00Z',
          location: 'Victoria Island Estate',
          impact: 'low',
          verified: true
        }
      ]
    }
  ]);

  const getCurrentRank = () => {
    return COMMUNITY_RANKS.find(rank => rank.rank === userStats.currentRank) || COMMUNITY_RANKS[0];
  };

  const getNextRank = () => {
    const nextRankIndex = Math.min(userStats.currentRank, COMMUNITY_RANKS.length - 1);
    return COMMUNITY_RANKS[nextRankIndex];
  };

  const getPointsForPeriod = () => {
    switch (selectedPeriod) {
      case 'week': return userStats.weeklyPoints;
      case 'month': return userStats.monthlyPoints;
      case 'year': return userStats.yearlyPoints;
      default: return userStats.monthlyPoints;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return 'post';
      case 'comment': return 'comment';
      case 'event': return 'calendar';
      case 'safety': return 'shield-alert';
      case 'help': return 'hand-heart';
      case 'review': return 'star';
      case 'report': return 'flag';
      default: return 'circle';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#E74C3C';
      case 'medium': return '#FF6B35';
      case 'low': return '#FFC107';
      default: return '#8E8E8E';
    }
  };

  const currentRank = getCurrentRank();
  const nextRank = getNextRank();

  const RankModal = () => (
    <Modal visible={showRankModal} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowRankModal(false)}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Community Ranks</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.rankDescription}>
            Earn points through community participation to unlock new ranks and privileges.
          </Text>
          
          {COMMUNITY_RANKS.map((rank, index) => {
            const isCurrentRank = rank.rank === userStats.currentRank;
            const isUnlocked = userStats.totalPoints >= rank.requirements;
            
            return (
              <View 
                key={rank.rank} 
                style={[
                  styles.rankItem, 
                  isCurrentRank && styles.currentRankItem,
                  !isUnlocked && styles.lockedRankItem
                ]}
              >
                <View style={styles.rankHeader}>
                  <View style={[styles.rankIcon, { backgroundColor: isUnlocked ? rank.color : '#E0E0E0' }]}>
                    <MaterialCommunityIcons 
                      name={rank.icon as any} 
                      size={24} 
                      color={isUnlocked ? '#FFFFFF' : '#8E8E8E'} 
                    />
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={[styles.rankTitle, !isUnlocked && styles.lockedText]}>
                      {rank.title}
                    </Text>
                    <Text style={[styles.rankDesc, !isUnlocked && styles.lockedText]}>
                      {rank.description}
                    </Text>
                    <Text style={styles.rankRequirement}>
                      {rank.requirements > 0 ? `${rank.requirements} points required` : 'Starting rank'}
                    </Text>
                  </View>
                  {isCurrentRank && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                  {!isUnlocked && rank.rank > userStats.currentRank && (
                    <MaterialCommunityIcons name="lock" size={20} color="#8E8E8E" />
                  )}
                </View>

                {isUnlocked && (
                  <View style={styles.benefitsList}>
                    <Text style={styles.benefitsTitle}>Benefits:</Text>
                    {rank.benefits.map((benefit, idx) => (
                      <View key={idx} style={styles.benefitItem}>
                        <MaterialCommunityIcons name="check" size={12} color={rank.color} />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const ActivityModal = () => {
    if (!selectedActivity) return null;
    
    return (
      <Modal visible={showActivityModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowActivityModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Activity Details</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.modalContent}>
            <View style={styles.activityDetailCard}>
              <View style={styles.activityDetailHeader}>
                <MaterialCommunityIcons 
                  name={getActivityIcon(selectedActivity.type)} 
                  size={24} 
                  color="#00A651" 
                />
                <Text style={styles.activityDetailTitle}>{selectedActivity.title}</Text>
              </View>
              
              <Text style={styles.activityDetailDescription}>
                {selectedActivity.description}
              </Text>
              
              <View style={styles.activityDetailMeta}>
                <View style={styles.activityDetailItem}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                  <Text style={styles.activityDetailText}>+{selectedActivity.points} points</Text>
                </View>
                
                <View style={styles.activityDetailItem}>
                  <MaterialCommunityIcons name="clock" size={16} color="#8E8E8E" />
                  <Text style={styles.activityDetailText}>
                    {formatTimestamp(selectedActivity.timestamp)}
                  </Text>
                </View>
                
                <View style={styles.activityDetailItem}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#8E8E8E" />
                  <Text style={styles.activityDetailText}>{selectedActivity.location}</Text>
                </View>
                
                <View style={styles.activityDetailItem}>
                  <View style={[styles.impactIndicator, { backgroundColor: getImpactColor(selectedActivity.impact) }]} />
                  <Text style={styles.activityDetailText}>
                    {selectedActivity.impact.charAt(0).toUpperCase() + selectedActivity.impact.slice(1)} impact
                  </Text>
                </View>
                
                {selectedActivity.verified && (
                  <View style={styles.activityDetailItem}>
                    <MaterialCommunityIcons name="check-decagram" size={16} color="#00A651" />
                    <Text style={styles.activityDetailText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => contextAwareGoBack(navigation, 'main')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#2C2C2C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community Activity</Text>
        <TouchableOpacity onPress={() => setShowRankModal(true)}>
          <MaterialCommunityIcons name="information" size={24} color="#00A651" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Current Rank Card */}
        <View style={styles.rankCard}>
          <View style={styles.rankCardHeader}>
            <View style={[styles.rankBadge, { backgroundColor: currentRank.color }]}>
              <MaterialCommunityIcons name={currentRank.icon as any} size={32} color="#FFFFFF" />
            </View>
            <View style={styles.rankDetails}>
              <Text style={styles.rankName}>{currentRank.title}</Text>
              <Text style={styles.rankPoints}>{userStats.totalPoints.toLocaleString()} total points</Text>
            </View>
          </View>
          
          <Text style={styles.rankProgress}>
            {nextRank.rank <= COMMUNITY_RANKS.length ? 
              `${nextRank.requirements - userStats.totalPoints} points to ${nextRank.title}` :
              'You\'ve reached the highest rank!'
            }
          </Text>
          
          {nextRank.rank <= COMMUNITY_RANKS.length && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min((userStats.totalPoints / nextRank.requirements) * 100, 100)}%` }
                ]} 
              />
            </View>
          )}
        </View>

        {/* Activity Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Activity Overview</Text>
          
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['week', 'month', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="star" size={20} color="#FFC107" />
              <Text style={styles.statNumber}>{getPointsForPeriod()}</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={20} color="#E74C3C" />
              <Text style={styles.statNumber}>{userStats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="thumb-up" size={20} color="#00A651" />
              <Text style={styles.statNumber}>{userStats.helpfulVotes}</Text>
              <Text style={styles.statLabel}>Helpful Votes</Text>
            </View>
          </View>
        </View>

        {/* Activity Categories */}
        {activityScores.map((category, index) => (
          <View key={index} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{category.category}</Text>
              <View style={styles.categoryLevel}>
                <Text style={styles.levelText}>Level {category.level}</Text>
              </View>
            </View>
            
            <View style={styles.categoryProgress}>
              <View style={styles.categoryProgressBar}>
                <View 
                  style={[
                    styles.categoryProgressFill, 
                    { width: `${(category.points / category.maxPoints) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.categoryProgressText}>
                {category.points}/{category.maxPoints} points
              </Text>
            </View>
            
            <Text style={styles.nextLevelText}>
              {category.nextLevelPoints} points to next level
            </Text>
            
            {/* Recent Activities */}
            <View style={styles.recentActivities}>
              <Text style={styles.recentTitle}>Recent Activities</Text>
              {category.activities.slice(0, 2).map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityItem}
                  onPress={() => {
                    setSelectedActivity(activity);
                    setShowActivityModal(true);
                  }}
                >
                  <View style={styles.activityIcon}>
                    <MaterialCommunityIcons 
                      name={getActivityIcon(activity.type)} 
                      size={16} 
                      color="#00A651" 
                    />
                  </View>
                  
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <View style={styles.activityMeta}>
                      <Text style={styles.activityPoints}>+{activity.points}</Text>
                      <Text style={styles.activityTime}>
                        {formatTimestamp(activity.timestamp)}
                      </Text>
                      {activity.verified && (
                        <MaterialCommunityIcons name="check-decagram" size={12} color="#00A651" />
                      )}
                    </View>
                  </View>
                  
                  <View style={[styles.impactDot, { backgroundColor: getImpactColor(activity.impact) }]} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <RankModal />
      <ActivityModal />
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
  scrollView: {
    flex: 1,
  },
  rankCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  rankCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rankDetails: {
    flex: 1,
  },
  rankName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginBottom: 4,
  },
  rankPoints: {
    fontSize: 14,
    color: '#8E8E8E',
  },
  rankProgress: {
    fontSize: 14,
    color: '#8E8E8E',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00A651',
    borderRadius: 3,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: '#00A651',
  },
  periodText: {
    fontSize: 14,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C2C2C',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E8E',
    textAlign: 'center',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
  },
  categoryLevel: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    color: '#00A651',
    fontWeight: '600',
  },
  categoryProgress: {
    marginBottom: 8,
  },
  categoryProgressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 4,
  },
  categoryProgressFill: {
    height: '100%',
    backgroundColor: '#00A651',
    borderRadius: 2,
  },
  categoryProgressText: {
    fontSize: 12,
    color: '#8E8E8E',
  },
  nextLevelText: {
    fontSize: 12,
    color: '#FF6B35',
    marginBottom: 16,
  },
  recentActivities: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 16,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    color: '#2C2C2C',
    marginBottom: 2,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityPoints: {
    fontSize: 11,
    color: '#00A651',
    fontWeight: '600',
    marginRight: 8,
  },
  activityTime: {
    fontSize: 11,
    color: '#8E8E8E',
    marginRight: 8,
  },
  impactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeText: {
    fontSize: 16,
    color: '#8E8E8E',
    minWidth: 60,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    textAlign: 'center',
  },
  placeholder: {
    minWidth: 60,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  rankDescription: {
    fontSize: 14,
    color: '#8E8E8E',
    lineHeight: 20,
    marginBottom: 20,
  },
  rankItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  currentRankItem: {
    borderColor: '#00A651',
    backgroundColor: '#F9FFF9',
  },
  lockedRankItem: {
    opacity: 0.6,
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 2,
  },
  rankDesc: {
    fontSize: 12,
    color: '#8E8E8E',
    marginBottom: 4,
  },
  rankRequirement: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '500',
  },
  lockedText: {
    color: '#C0C0C0',
  },
  currentBadge: {
    backgroundColor: '#00A651',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  benefitsList: {
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 12,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C2C2C',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 11,
    color: '#2C2C2C',
    marginLeft: 6,
  },
  activityDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  activityDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C2C2C',
    marginLeft: 12,
  },
  activityDetailDescription: {
    fontSize: 14,
    color: '#2C2C2C',
    lineHeight: 20,
    marginBottom: 16,
  },
  activityDetailMeta: {
    gap: 12,
  },
  activityDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDetailText: {
    fontSize: 14,
    color: '#8E8E8E',
    marginLeft: 8,
  },
  impactIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
});